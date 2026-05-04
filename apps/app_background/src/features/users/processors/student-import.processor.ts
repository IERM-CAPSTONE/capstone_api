import { Controller, Inject, Logger } from '@nestjs/common';
import { ClientProxy, Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { BaseJobResult, MESSAGE_PATTERNS, RABBITMQ_CLIENTS, UserImportFinishedData, UserImportJobData } from '@app/queue';
import { IUserRepository, RoleType, USER_REPOSITORY, User } from '@app/users';
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

        this.logger.log(`Processing account import from file: ${data.fileName}`);

        try {
            const buffer = Buffer.from(data.fileContent, 'base64');
            const workbook = xlsx.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames.find((name) => name.toLowerCase() === 'accounts') ?? workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const rows: Record<string, any>[] = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

            this.logger.log(`Found ${rows.length} rows of data in the file.`);

            let successCount = 0;
            let errorCount = 0;
            let createdCount = 0;
            let updatedCount = 0;
            let skippedCount = 0;
            const failedItems: Array<{ row: number; data: any; error: string }> = [];

            for (const [index, rowData] of rows.entries()) {
                try {
                    const mapped = this.normalizeImportRow(rowData);

                    if (mapped.skip) {
                        skippedCount++;
                        continue;
                    }

                    if (!mapped.fullName) {
                        throw new Error('FullName or Name is required');
                    }

                    if (!mapped.email && !mapped.username && !mapped.code) {
                        throw new Error('At least one of Email, Username, or Code is required');
                    }

                    const existingUser = await this.findExistingUser(mapped);
                    if (existingUser) {
                        existingUser.updateProfile({
                            email: mapped.email ?? undefined,
                            username: mapped.username ?? undefined,
                            fullName: mapped.fullName ?? undefined,
                            code: mapped.code ?? undefined,
                            campus: mapped.campus ?? undefined,
                        });

                        if (mapped.role) {
                            existingUser.changeRole(mapped.role);
                        }

                        if (mapped.isActive === true && !existingUser.isActive) {
                            existingUser.activate();
                        } else if (mapped.isActive === false && existingUser.isActive) {
                            existingUser.deactivate();
                        }

                        await this.userRepository.save(existingUser);
                        successCount++;
                        updatedCount++;
                        continue;
                    }

                    const user = User.create({
                        id: uuidv4(),
                        email: mapped.email,
                        username: mapped.username ?? (mapped.email ? mapped.email.split('@')[0].toLowerCase() : mapped.code?.toLowerCase()),
                        fullName: mapped.fullName ?? undefined,
                        code: mapped.code ?? undefined,
                        role: mapped.role ?? RoleType.STUDENT,
                        campus: mapped.campus ?? undefined,
                        isActive: mapped.isActive,
                    });

                    await this.userRepository.save(user);

                    this.apiEventClient.emit(MESSAGE_PATTERNS.USER.ACTIVITY_LOGGED, {
                        userId: user.id,
                        userName: user.fullName || user.email,
                        userCode: user.code?.value,
                        timestamp: new Date().toISOString(),
                    });

                    successCount++;
                    createdCount++;
                    this.logger.debug(`Imported account: ${mapped.email ?? mapped.username ?? mapped.code}`);
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Unknown import error';
                    this.logger.error(`Error processing import row ${index + 2}: ${message}`);
                    failedItems.push({
                        row: index + 2,
                        data: rowData,
                        error: message,
                    });
                    errorCount++;
                }
            }

            this.logger.log(
                `Account import completed. Created: ${createdCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`
            );

            const finishedData: UserImportFinishedData = {
                fileName: data.fileName,
                successCount,
                errorCount,
                createdCount,
                updatedCount,
                skippedCount,
                failedItems,
                timestamp: new Date(),
            };
            this.apiEventClient.emit(MESSAGE_PATTERNS.USER.IMPORT_FINISHED, finishedData);

            channel.ack(originalMsg);

            return {
                jobId: originalMsg.properties.messageId || 'unknown',
                success: true,
                processingTime: Date.now() - startTime,
                completedAt: new Date(),
            };
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown import error';
            this.logger.error(`Critical error during account import: ${message}`);
            channel.nack(originalMsg, false, false);

            return {
                jobId: originalMsg.properties.messageId || 'unknown',
                success: false,
                processingTime: Date.now() - startTime,
                error: message,
                completedAt: new Date(),
            };
        }
    }

    private normalizeImportRow(rowData: Record<string, any>) {
        const getString = (...keys: string[]) => {
            for (const key of keys) {
                const value = rowData[key];
                if (value !== undefined && value !== null && String(value).trim() !== '') {
                    return String(value).trim();
                }
            }
            return null;
        };

        const normalizeRole = (value: string | null): RoleType | null => {
            if (!value) return null;
            const normalized = value.trim().toUpperCase();
            if (Object.values(RoleType).includes(normalized as RoleType)) {
                return normalized as RoleType;
            }

            const compact = normalized.replace(/[\s_-]+/g, '');
            const friendlyRoleMap: Record<string, RoleType> = {
                ADMIN: RoleType.ADMIN,
                SYSTEMADMIN: RoleType.ADMIN,
                SYSTEMADMINISTRATOR: RoleType.ADMIN,
                EXAMOFFICER: RoleType.EXAM_OFFICER,
                PROCTOR: RoleType.PROCTOR,
                HALLINVIGILATOR: RoleType.HALL_INVIGILATOR,
                ITSUPPORT: RoleType.IT_SUPPORT,
                STUDENT: RoleType.STUDENT,
            };

            return friendlyRoleMap[compact] ?? null;
        };

        const normalizeBoolean = (value: string | null): boolean => {
            if (!value) return true;
            const normalized = value.trim().toLowerCase();
            if (['false', '0', 'inactive', 'locked', 'disabled'].includes(normalized)) {
                return false;
            }
            return true;
        };

        const code = getString('Code', 'AccountCode', 'UserCode', 'StudentCode', 'TeacherCode');
        const fullName = getString('FullName', 'Name');
        const email = getString('Email');
        const username = getString('Username', 'UserName', 'Login');
        const campus = getString('Campus');
        const role = normalizeRole(getString('Role'));
        const isActive = normalizeBoolean(getString('IsActive', 'Status', 'Active'));

        return {
            code,
            fullName,
            email,
            username,
            campus: campus ? campus.toUpperCase() : null,
            role,
            isActive,
            skip:
                (code?.startsWith('#') ?? false) ||
                (!code && !fullName && !email && !username && !campus && role === null),
        };
    }

    private async findExistingUser(mapped: {
        email: string | null;
        username: string | null;
        code: string | null;
    }) {
        if (mapped.email) {
            const existingByEmail = await this.userRepository.findOne({ email: mapped.email });
            if (existingByEmail) return existingByEmail;
        }

        if (mapped.username) {
            const existingByUsername = await this.userRepository.findOne({ username: mapped.username.toLowerCase() });
            if (existingByUsername) return existingByUsername;
        }

        if (mapped.code) {
            const existingByCode = await this.userRepository.findOne({ code: mapped.code });
            if (existingByCode) return existingByCode;
        }

        return null;
    }
}
