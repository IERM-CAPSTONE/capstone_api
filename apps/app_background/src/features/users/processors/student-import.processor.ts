import { Controller, Logger, Inject } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext, ClientProxy } from '@nestjs/microservices';
import { MESSAGE_PATTERNS, UserImportJobData, BaseJobResult, RABBITMQ_CLIENTS, UserImportFinishedData } from '@app/queue';
import { IUserRepository, USER_REPOSITORY, User, RoleType } from '@app/users';
import * as xlsx from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

@Controller()
export class StudentImportProcessor {
    private readonly logger = new Logger(StudentImportProcessor.name);

    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        @Inject(RABBITMQ_CLIENTS.API_EVENT_SERVICE)
        private readonly apiEventClient: ClientProxy,
    ) { }

    @MessagePattern(MESSAGE_PATTERNS.USER.IMPORT_STUDENTS)
    async handleImportStudents(
        @Payload() data: UserImportJobData,
        @Ctx() context: RmqContext,
    ): Promise<BaseJobResult> {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        const startTime = Date.now();

        this.logger.log(`Processing student import from file: ${data.fileName}`);

        try {
            // 1. Decode base64 to buffer
            const buffer = Buffer.from(data.fileContent, 'base64');

            // 2. Read Excel file
            const workbook = xlsx.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // 3. Convert data to JSON
            // Expected columns: StudentCode, Name, Email, Role
            const students: any[] = xlsx.utils.sheet_to_json(worksheet);

            this.logger.log(`Found ${students.length} rows of data in the file.`);

            let successCount = 0;
            let errorCount = 0;

            // 4. Process each student
            for (const studentData of students) {
                try {
                    const { StudentCode, Name, Email, Role } = studentData;

                    if (!Email || !Name) {
                        this.logger.warn(`Skipping row missing Email or Name: ${JSON.stringify(studentData)}`);
                        errorCount++;
                        continue;
                    }

                    // Check if user exists
                    const existingUser = await this.userRepository.findOne({ email: Email });
                    if (existingUser) {
                        this.logger.debug(`Student already exists: ${Email}`);
                        successCount++;
                        continue;
                    }

                    // Create User using Domain Entity
                    const role = (Role && Object.values(RoleType).includes(Role as RoleType))
                        ? (Role as RoleType)
                        : RoleType.STUDENT;

                    const user = User.create({
                        id: uuidv4(),
                        email: Email,
                        fullName: Name,
                        code: StudentCode?.toString(),
                        role: role
                    });

                    await this.userRepository.save(user);

                    // Emit event for real-time notification
                    this.apiEventClient.emit(MESSAGE_PATTERNS.USER.ACTIVITY_LOGGED, {
                        userId: user.id,
                        userName: user.fullName || user.email,
                        userCode: user.code?.value,
                        timestamp: new Date().toISOString(),
                    });

                    successCount++;
                    this.logger.debug(`Imported: ${Email}`);
                } catch (err) {
                    this.logger.error(`Error processing student ${studentData.Email}: ${err.message}`);
                    errorCount++;
                }
            }

            this.logger.log(`🏁 Import completed. Success: ${successCount}, Errors: ${errorCount}`);

            // Emit finished event to RabbitMQ
            const finishedData: UserImportFinishedData = {
                fileName: data.fileName,
                successCount,
                errorCount,
                timestamp: new Date(),
            };
            this.apiEventClient.emit(MESSAGE_PATTERNS.USER.IMPORT_FINISHED, finishedData);

            // Acknowledge the message
            channel.ack(originalMsg);

            return {
                jobId: originalMsg.properties.messageId || 'unknown',
                success: true,
                processingTime: Date.now() - startTime,
                completedAt: new Date(),
            };
        } catch (error) {
            this.logger.error(` Critical error during student import: ${error.message}`);

            // Reject the message and do not requeue if error is due to corrupted file data
            channel.nack(originalMsg, false, false);

            return {
                jobId: originalMsg.properties.messageId || 'unknown',
                success: false,
                processingTime: Date.now() - startTime,
                error: error.message,
                completedAt: new Date(),
            };
        }
    }
}
