import { Controller, Injectable, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { PrismaService } from '@app/prisma';
import { MESSAGE_PATTERNS } from '@app/queue';
import { SchedulingService } from '@app/exam-sessions';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { Campus } from '@prisma/client';

interface AutoGenerateScheduleJob {
    semesterId: string;
    campus: Campus;
    finalWeek: number;
    retakeWeek: number;
    roomIds: string[];
    fileData: string; // Base64 CSV
}

@Controller()
@Injectable()
export class AutoGenerateScheduleProcessor {
    private readonly logger = new Logger(AutoGenerateScheduleProcessor.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly schedulingService: SchedulingService,
    ) { }

    @MessagePattern(MESSAGE_PATTERNS.EXAM.AUTO_GENERATE_SCHEDULE)
    async handleAutoGenerate(
        @Payload() data: AutoGenerateScheduleJob,
        @Ctx() context: RmqContext,
    ) {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();

        this.logger.log(`🔄 Processing advanced auto-generate schedule for semester: ${data.semesterId}`);

        try {
            // 1. Parse CSV Data
            const excelData = this.parseCsv(data.fileData);
            this.logger.log(`Parsed ${excelData.length} student-subject registrations`);

            // 2. Clear existing scheduled sessions for this semester/campus to avoid duplicates
            // (Optional: depending on requirement, maybe only clear "Scheduled" ones)
            await this.prisma.examSession.deleteMany({
                where: {
                    semesterId: data.semesterId,
                    campus: data.campus as Campus,
                    status: 'Scheduled'
                }
            });

            // 3. Call Scheduling Service
            const scheduledSessions = await this.schedulingService.generateSchedule({
                semesterId: data.semesterId,
                campus: data.campus as Campus,
                finalWeek: data.finalWeek,
                retakeWeek: data.retakeWeek,
                roomIds: data.roomIds,
                excelData: excelData
            });

            this.logger.log(`Algorithm generated ${scheduledSessions.length} sessions`);

            // 4. Save sessions and registrations
            for (const session of scheduledSessions) {
                const sessionId = uuidv4();

                this.logger.debug(`Saving session ${session.subjectCode} for ${session.studentCodes.length} students`);

                // Get Room Info for seat assignment
                const room = await this.prisma.examRoom.findUnique({
                    where: { id: session.roomId }
                });

                const maxRows = room?.max_rows || 5;
                const maxCols = room?.max_columns || 4;

                // Create ExamSession
                await this.prisma.examSession.create({
                    data: {
                        id: sessionId,
                        examRoomId: session.roomId,
                        subjectCode: session.subjectCode,
                        examOpenTime: session.openTime,
                        examCloseTime: session.closeTime,
                        semesterId: data.semesterId,
                        status: 'Scheduled',
                        campus: data.campus as Campus,
                        examType: {
                            connect: [{ id: session.examTypeId }]
                        },
                    }
                });

                // Calculate seats
                const assignedSeats = this.schedulingService.assignSeats(
                    session.studentCodes.length,
                    maxRows,
                    maxCols
                );

                // Save student registrations for this session
                for (let i = 0; i < session.studentCodes.length; i++) {
                    const studentCode = session.studentCodes[i];
                    const seatInfo = assignedSeats[i];

                    const student = await this.prisma.user.findFirst({
                        where: { username: studentCode }
                    });

                    if (student) {
                        const seatId = uuidv4();
                        const seatNumber = `R${seatInfo.row}C${seatInfo.col}`;

                        // Create ExamSeat for this session
                        await this.prisma.examSeat.create({
                            data: {
                                id: seatId,
                                examSessionId: sessionId,
                                row: seatInfo.row,
                                col: seatInfo.col,
                                status: 'Available'
                            }
                        });

                        await this.prisma.studentExam.create({
                            data: {
                                id: uuidv4(),
                                studentId: student.id,
                                examSessionId: sessionId,
                                status: 'REGISTERED',
                                seatPosition: seatId,
                                seatNumber: seatNumber,
                                parts: {
                                    create: {
                                        id: uuidv4(),
                                        examTypeId: session.examTypeId,
                                    }
                                }
                            }
                        });
                    } else {
                        this.logger.warn(`Student ${studentCode} not found`);
                    }
                }
            }

            this.logger.log(`✅ Successfully generated and saved schedule`);
            channel.ack(originalMsg);
        } catch (error) {
            this.logger.error(`❌ Error in schedule generation: ${error.message}`);
            this.logger.error(error.stack);
            channel.ack(originalMsg);
        }
    }

    private parseCsv(base64Data: string): { studentCode: string; subjectCode: string }[] {
        const buffer = Buffer.from(base64Data, 'base64');
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet) as any[];

        // Expected headers: Roll, SubCode (from StudSub.csv example)
        return data.map(item => ({
            studentCode: item.Roll || item.studentCode || item.Login,
            subjectCode: item.SubCode || item.subjectCode
        })).filter(item => item.studentCode && item.subjectCode);
    }
}
