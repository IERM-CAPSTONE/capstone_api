import { Controller, Injectable, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { PrismaService } from '@app/prisma';
import { MESSAGE_PATTERNS, RABBITMQ_CLIENTS } from '@app/queue';
import { SchedulingService } from '@app/exam-sessions';
import { Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import { Campus, ExamSessionStatus } from '@prisma/client';

interface AutoGenerateScheduleJob {
    semesterId: string;
    campus: Campus[];
    finalWeek?: number;
    retakeWeek?: number;
    practicalWeek?: number;
    courseraWeek?: number;
    courseraRetakeWeek?: number;
    roomIds: string[];
    fileData?: string; // Base64 CSV (legacy fallback for single campus)
    campusFiles?: { campus: string; fileData: string }[]; // Per-campus files
    classScheduleFiles?: { campus: string; fileData: string }[]; // Per-campus class schedule files
}

@Controller()
@Injectable()
export class AutoGenerateScheduleProcessor {
    private readonly logger = new Logger(AutoGenerateScheduleProcessor.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly schedulingService: SchedulingService,
        @Inject(RABBITMQ_CLIENTS.API_EVENT_SERVICE)
        private readonly apiEventClient: ClientProxy,
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
            // 1. Parse CSV Data - support per-campus files or single file fallback
            let excelData: any[];
            const campuses = Array.isArray(data.campus) ? data.campus : [data.campus];

            if (data.campusFiles && data.campusFiles.length > 0) {
                // Parse each campus file separately and merge
                const campusDataMap = new Map<string, any[]>();
                for (const cf of data.campusFiles) {
                    if (cf.fileData) {
                        const rows = this.parseCsv(cf.fileData, cf.campus as Campus);
                        campusDataMap.set(cf.campus, rows);
                        this.logger.log(`Campus ${cf.campus}: parsed ${rows.length} registrations`);
                    }
                }
                excelData = [];
                for (const [campus, rows] of campusDataMap.entries()) {
                    excelData.push(...rows.map((r: any) => ({ ...r, campus: campus })));
                }
            } else if (data.fileData) {
                const defaultCampus = campuses[0] as Campus;
                excelData = this.parseCsv(data.fileData, defaultCampus).map(r => ({ ...r, campus: defaultCampus }));
            } else {
                throw new Error('No student registration file provided');
            }

            // 2. Parse Class Schedule Data (busySlots)
            const busySlotsMap = new Map<string, Set<string>>(); // StudentCode -> Set<"day_slot">
            if (data.classScheduleFiles && data.classScheduleFiles.length > 0) {
                this.logger.log(`Parsing ${data.classScheduleFiles.length} class schedule files...`);
                for (const cs of data.classScheduleFiles) {
                    if (cs.fileData) {
                        const rows = this.parseClassSchedule(cs.fileData);
                        for (const row of rows) {
                            if (!busySlotsMap.has(row.studentCode)) {
                                busySlotsMap.set(row.studentCode, new Set<string>());
                            }
                            busySlotsMap.get(row.studentCode).add(`${row.dayIndex}_${row.slot}`);
                        }
                    }
                }
                this.logger.log(`Populated busySlots for ${busySlotsMap.size} students`);
            }

            this.logger.log(`Parsed ${excelData.length} total student-subject registrations`);

            await this.prisma.examSession.deleteMany({
                where: {
                    semesterId: data.semesterId,
                    campus: { in: campuses as Campus[] },
                    status: ExamSessionStatus.Draft
                }
            });

            // 3. Pre-fetch rooms
            const rooms = await this.prisma.examRoom.findMany({
                where: { id: { in: data.roomIds } }
            });

            // 4. Call Scheduling Service
            const mainCampus = campuses[0] as Campus;
            const semester = await this.prisma.semester.findUnique({ where: { id: data.semesterId } });
            require('fs').writeFileSync('/tmp/debug_semester.json', JSON.stringify(semester, null, 2));

            const scheduledSessions = await this.schedulingService.generateSchedule({
                semesterId: data.semesterId,
                campus: mainCampus,
                finalWeek: data.finalWeek,
                retakeWeek: data.retakeWeek,
                practicalWeek: data.practicalWeek,
                courseraWeek: data.courseraWeek,
                courseraRetakeWeek: data.courseraRetakeWeek,
                roomIds: data.roomIds,
                excelData: excelData,
                busySlots: busySlotsMap
            });

            this.logger.log(`Algorithm generated ${scheduledSessions.length} sessions`);

            // 5. Pre-process Students and Rooms
            const allStudentCodes = new Set<string>();
            scheduledSessions.forEach(s => s.studentCodes.forEach(code => allStudentCodes.add(code.trim())));

            const existingUsers = await this.prisma.user.findMany({
                where: {
                    OR: [
                        { code: { in: Array.from(allStudentCodes) } },
                        { username: { in: Array.from(allStudentCodes) } }
                    ]
                }
            });

            const userMap = new Map<string, any>();
            existingUsers.forEach(u => {
                if (u.code) userMap.set(u.code.trim(), u);
                if (u.username) userMap.set(u.username.trim(), u);
            });

            // Create missing students
            const missingCodes = Array.from(allStudentCodes).filter(code => !userMap.has(code));
            if (missingCodes.length > 0) {
                this.logger.log(`Creating ${missingCodes.length} missing placeholder students...`);
                await this.prisma.user.createMany({
                    data: missingCodes.map(code => ({
                        id: uuidv4(),
                        code: code,
                        username: code,
                        fullName: `Student ${code}`,
                        role: 'STUDENT',
                        isActive: true
                    })),
                    skipDuplicates: true
                });

                // Refresh user map
                const newlyCreated = await this.prisma.user.findMany({
                    where: { code: { in: missingCodes } }
                });
                newlyCreated.forEach(u => userMap.set(u.code.trim(), u));
            }

            // Pre-fetch all rooms
            const roomIds = Array.from(new Set(scheduledSessions.map(s => s.roomId)));
            const roomsInDb = await this.prisma.examRoom.findMany({
                where: { id: { in: roomIds } }
            });
            const roomMap = new Map(roomsInDb.map(r => [r.id, r]));

            // Batch data collection
            const examSeatsToCreate: any[] = [];
            const studentExamsToCreate: any[] = [];
            const studentExamPartsToCreate: any[] = [];

            this.logger.log(`Preparing bulk data for ${scheduledSessions.length} sessions...`);

            for (const session of scheduledSessions) {
                const sessionId = uuidv4();
                const room = roomMap.get(session.roomId);
                const maxRows = room?.max_rows || 5;
                const maxCols = room?.max_columns || 4;

                // Create ExamSession (using create for relation support)
                await this.prisma.examSession.create({
                    data: {
                        id: sessionId,
                        examRoomId: session.roomId,
                        subjectCode: session.subjectCode,
                        examOpenTime: session.openTime,
                        examCloseTime: session.closeTime,
                        semesterId: data.semesterId,
                        status: ExamSessionStatus.Draft,
                        examType: session.examType as any,
                        campus: (session.campus || (room as any)?.campus || mainCampus) as any,
                        examParts: { connect: session.examPartIds.map(id => ({ id })) },
                    }
                });

                const assignedSeats = this.schedulingService.assignSeats(
                    session.studentCodes.length,
                    maxRows,
                    maxCols
                );

                const sessionStudents = new Set<string>(); // Keep track of student IDs already added to this session
                for (let i = 0; i < session.studentCodes.length; i++) {
                    const studentCode = session.studentCodes[i].trim();
                    const student = userMap.get(studentCode);
                    if (!student || sessionStudents.has(student.id)) continue;

                    sessionStudents.add(student.id);

                    const seatInfo = assignedSeats[i];
                    const seatId = uuidv4();
                    const studentExamId = uuidv4();
                    const seatIdx = (seatInfo.row - 1) * maxCols + seatInfo.col;

                    examSeatsToCreate.push({
                        id: seatId,
                        examSessionId: sessionId,
                        row: seatInfo.row,
                        col: seatInfo.col,
                        status: 'Assigned'
                    });

                    studentExamsToCreate.push({
                        id: studentExamId,
                        studentId: student.id,
                        examSessionId: sessionId,
                        seatPosition: seatId,
                        seatNumber: seatIdx.toString(),
                        stt: i + 1,
                    });

                    for (const partId of session.examPartIds) {
                        studentExamPartsToCreate.push({
                            id: uuidv4(),
                            studentExamId: studentExamId,
                            examPartId: partId,
                        });
                    }
                }
            }

            // Bulk Insert all sub-entities
            this.logger.log(`Bulk inserting: ${examSeatsToCreate.length} seats, ${studentExamsToCreate.length} studentExams...`);

            if (examSeatsToCreate.length > 0) {
                await this.prisma.examSeat.createMany({ data: examSeatsToCreate });
            }
            if (studentExamsToCreate.length > 0) {
                await this.prisma.studentExam.createMany({ data: studentExamsToCreate });
            }
            if (studentExamPartsToCreate.length > 0) {
                await this.prisma.studentExamPart.createMany({ data: studentExamPartsToCreate });
            }

            this.logger.log(`✅ Successfully generated and saved schedule`);

            // 6. Notify API that we are done
            this.apiEventClient.emit(MESSAGE_PATTERNS.EXAM.AUTO_GENERATE_FINISHED, {
                semesterId: data.semesterId,
                campuses: campuses,
                sessionCount: scheduledSessions.length,
                success: true
            });

            channel.ack(originalMsg);
        } catch (error) {
            this.logger.error(`❌ Error in schedule generation: ${error.message}`);
            this.logger.error(error.stack);
            channel.ack(originalMsg);
        }
    }

    private parseCsv(base64Data: string, campus?: Campus): { studentCode: string; subjectCode: string; examType?: string; date?: string; slot?: number; scheduleId?: string }[] {
        const buffer = Buffer.from(base64Data, 'base64');
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet) as any[];

        // Process data with deduplication (case-insensitive + campus awareness)
        const uniquePairs = new Set<string>();
        const result: any[] = [];

        for (const item of data) {
            const rawStudentCode = String(item.Roll || item.RollNumber || item.studentCode || item.Login || '').trim();
            const subjectCode = String(item.SubCode || item.SubjectCode || item.subjectCode || '').trim().toUpperCase();

            // Detect Exam Type from common columns
            const rawExamType = String(item.ExamType || item.SessionType || item.Type || item.SType || '').trim().toUpperCase();
            let examType: string | undefined = undefined;
            if (rawExamType.includes('RE')) examType = 'RE';
            else if (rawExamType.includes('PE')) examType = 'PE';
            else if (rawExamType.includes('FE')) examType = 'FE';

            if (!rawStudentCode || !subjectCode) continue;

            const studentCode = rawStudentCode.toUpperCase();
            // Prefix with campus and examType to allow same student-subject in different campuses or types
            const pairKey = `${campus || 'DEFAULT'}|${studentCode}|${subjectCode}|${examType || 'ALL'}`;

            if (uniquePairs.has(pairKey)) continue;

            uniquePairs.add(pairKey);
            result.push({
                studentCode: rawStudentCode,
                subjectCode,
                examType,
                scheduleId: item.ScheduleID ? String(item.ScheduleID) : undefined
            });
        }

        return result;
    }

    private parseClassSchedule(base64Data: string): { studentCode: string; dayIndex: number; slot: number }[] {
        const buffer = Buffer.from(base64Data, 'base64');
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet) as any[];

        const result: { studentCode: string; dayIndex: number; slot: number }[] = [];

        for (const item of data) {
            const studentCode = String(item.RollNumber || item.Roll || item.Login || '').trim();
            const dateStr = item.Date;
            const slotStr = item.Slot;

            if (!studentCode || !dateStr || slotStr === undefined) continue;

            const date = new Date(dateStr);
            if (isNaN(date.getTime())) continue;

            // getDay() returns 0 (Sun) to 6 (Sat)
            // We want 0 (Mon) to 6 (Sun)
            let dayIndex = date.getDay() - 1;
            if (dayIndex === -1) dayIndex = 6; // Sunday becomes 6

            const slot = Number(slotStr);

            result.push({
                studentCode,
                dayIndex,
                slot
            });
        }

        return result;
    }
}
