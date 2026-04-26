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
    selectedType?: 'FE' | 'RE' | 'PE' | 'COURSERA_FE' | 'COURSERA_RE';
    finalWeek?: number;
    retakeWeek?: number;
    practicalWeek?: number;
    courseraWeek?: number;
    courseraRetakeWeek?: number;
    roomIds: string[];
    fileData?: string; // Base64 CSV (legacy fallback for single campus)
    campusFiles?: { campus: string; fileData: string }[]; // Per-campus files
    classScheduleFiles?: { campus: string; fileData: string }[]; // Per-campus class schedule files
    examDays?: number; // 6 or 7
    proctorEmails?: string[];
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

            // 3. Pre-fetch rooms to identify active campuses
            const allRooms = await this.prisma.examRoom.findMany({
                where: { id: { in: data.roomIds } }
            });
            const roomMapByCampus = new Map<Campus, string[]>();
            allRooms.forEach(r => {
                const camp = r.campus as Campus;
                if (!roomMapByCampus.has(camp)) roomMapByCampus.set(camp, []);
                roomMapByCampus.get(camp).push(r.id);
            });

            const activeCampuses = Array.from(roomMapByCampus.keys());
            this.logger.log(`🚀 Starting UNIFIED scheduling for ${activeCampuses.length} campuses: ${activeCampuses.join(', ')} — same subject will share the same exam slot across all campuses`);

            // Single unified scheduling call — the service groups by subjectCode internally
            // so ALL campuses' students for the same subject end up in the SAME time slot
            const { sessions: allScheduledSessions, failedPools: totalFailedPools } = await this.schedulingService.generateSchedule({
                semesterId: data.semesterId,
                campus: activeCampuses[0],           // primary campus (used as fallback only)
                selectedType: data.selectedType,
                finalWeek: data.finalWeek,
                retakeWeek: data.retakeWeek,
                practicalWeek: data.practicalWeek,
                courseraWeek: data.courseraWeek,
                courseraRetakeWeek: data.courseraRetakeWeek,
                roomIds: data.roomIds,               // ALL room IDs across all campuses
                excelData: excelData,                // ALL campus data (each row has .campus set)
                busySlots: busySlotsMap,
                examDays: data.examDays
            });

            const totalScheduledSessionsCount = allScheduledSessions.length;

            // 4. Compute summary statistics (count registrations, not unique students)
            // A student may appear in multiple sessions (FE + PE + RE different subjects)
            let scheduledRegistrations = 0;
            allScheduledSessions.forEach(s => scheduledRegistrations += s.studentCodes.length);

            let unscheduledRegistrations = 0;
            totalFailedPools.forEach(f => unscheduledRegistrations += (f._failStudents || []).length);

            const totalRegistered = excelData.length;

            this.logger.log(`📊 All campuses processed. Total: ${allScheduledSessions.length} sessions, ${totalFailedPools.length} failed pools.`);
            this.logger.log(`📊 [STATS] Registered: ${totalRegistered} records | Scheduled registrations: ${scheduledRegistrations} | Unscheduled registrations: ${unscheduledRegistrations}`);
            if (totalFailedPools.length > 0) {
                const byReason = totalFailedPools.reduce<Record<string, number>>((acc, f) => {
                    acc[f.reason] = (acc[f.reason] || 0) + 1;
                    return acc;
                }, {});
                Object.entries(byReason).forEach(([reason, count]) =>
                    this.logger.warn(`📊 [STATS]   ❌ ${reason}: ${count} subject(s)`)
                );
            }

            // Emit early calculated event so UI can display errors while DB is saving
            // Resolve room IDs → room numbers for readable error messages
            const allRoomNumberMap = new Map<string, string>(allRooms.map(r => [r.id, (r as any).roomNumber || r.id]));
            const enrichedFailedItems = totalFailedPools.map(f => ({
                subjectCode: f.subjectCode,
                examType: f.examType,
                campus: f.campus,
                reason: f.reason,
                note: f.note,
                students: f._failStudents || [],
                registrations: excelData
                    .filter((row: any) =>
                        row.subjectCode === f.subjectCode &&
                        (row.campus || '') === (f.campus || '') &&
                        (!f.examType || !row.examType || row.examType === f.examType) &&
                        (f._failStudents || []).includes(String(row.studentCode || '').trim())
                    )
                    .map((row: any) => ({
                        Roll: row.studentCode || '',
                        SubCode: row.subjectCode || '',
                        Login: row.login || '',
                        Online: row.online || '',
                    })),
                rooms: f._failRooms
                    ? {
                        campus: f._failRooms.campus,
                        needed: f._failRooms.needed,
                        available: f._failRooms.available,
                        roomNumbers: (f._failRooms.roomIds || []).map(id => allRoomNumberMap.get(id) || id),
                    }
                    : undefined,
            }));

            const summary = {
                totalRegistered: totalRegistered,
                scheduledCount: scheduledRegistrations,
                failedCount: unscheduledRegistrations,
                failedSubjects: totalFailedPools.length,
                reasonStats: totalFailedPools.reduce<Record<string, number>>((acc, f) => {
                    acc[f.reason] = (acc[f.reason] || 0) + 1;
                    return acc;
                }, {}),
            };

            // INJECT SUMMARY ROWS INTO EXCEL DATA
            const summaryRows = [
                { subjectCode: '=== SUMMARY STATISTICS ===', examType: '', campus: '', reason: 'VALUE', note: '' },
                { subjectCode: 'Total Excel Records', examType: '', campus: '', reason: summary.totalRegistered.toString(), note: '' },
                { subjectCode: 'Successfully Scheduled Students', examType: '', campus: '', reason: summary.scheduledCount.toString(), note: '' },
                { subjectCode: 'Unscheduled Students', examType: '', campus: '', reason: summary.failedCount.toString(), note: '' },
                { subjectCode: 'Total Failed Subject Pools', examType: '', campus: '', reason: summary.failedSubjects.toString(), note: '' },
                ...Object.entries(summary.reasonStats).map(([reason, count]) => ({
                    subjectCode: `Count by Reason: ${reason}`,
                    examType: '',
                    campus: '',
                    reason: count.toString(),
                    note: ''
                })),
                { subjectCode: '==========================', examType: '', campus: '', reason: '', note: '' },
                { subjectCode: '', examType: '', campus: '', reason: '', note: '' }, // empty row for spacing
            ];

            const finalFailureDisplay = [...summaryRows, ...enrichedFailedItems];

            this.apiEventClient.emit(MESSAGE_PATTERNS.EXAM.AUTO_GENERATE_CALCULATED, {
                semesterId: data.semesterId,
                failedCount: totalFailedPools.length,
                failedItems: finalFailureDisplay,
                summary: summary
            });
            // 5. Save everything to Database
            const allStudentCodes = new Set<string>();
            allScheduledSessions.forEach(s => s.studentCodes.forEach(code => allStudentCodes.add(code.trim())));
            
            const studentCodeArray = Array.from(allStudentCodes);
            const userMap = new Map<string, any>();
            const chunkSize = 5000;

            // Fetch users in chunks
            for (let i = 0; i < studentCodeArray.length; i += chunkSize) {
                const chunk = studentCodeArray.slice(i, i + chunkSize);
                const existingUsers = await this.prisma.user.findMany({
                    where: {
                        OR: [
                            { code: { in: chunk } },
                            { username: { in: chunk } }
                        ]
                    }
                });
                existingUsers.forEach(u => {
                    if (u.code) userMap.set(u.code.trim(), u);
                    if (u.username) userMap.set(u.username.trim(), u);
                });
            }

            // Create missing students in chunks
            const missingCodes = studentCodeArray.filter(code => !userMap.has(code));
            if (missingCodes.length > 0) {
                this.logger.log(`Creating ${missingCodes.length} missing placeholder students...`);
                for (let i = 0; i < missingCodes.length; i += chunkSize) {
                    const chunk = missingCodes.slice(i, i + chunkSize);
                    await this.prisma.user.createMany({
                        data: chunk.map(code => ({
                            id: uuidv4(),
                            code: code,
                            username: code,
                            fullName: `Student ${code}`,
                            role: 'STUDENT',
                            isActive: true
                        })),
                        skipDuplicates: true
                    });

                    const newlyCreated = await this.prisma.user.findMany({ where: { code: { in: chunk } } });
                    newlyCreated.forEach(u => userMap.set(u.code.trim(), u));
                }
            }

            const roomsInDb = await this.prisma.examRoom.findMany({
                where: { id: { in: data.roomIds } }
            });
            const roomMap = new Map(roomsInDb.map(r => [r.id, r]));
            const proctors = await this.resolveProctors(data.proctorEmails || []);
            if (proctors.length > 0) {
                this.assignConvenientProctors(allScheduledSessions, proctors);
                this.logger.log(`Assigned ${proctors.length} proctors across ${allScheduledSessions.length} generated sessions`);
            } else {
                this.logger.warn('No proctor email pool provided; generated sessions will not have proctors assigned.');
            }

            this.logger.log(`Preparing bulk save for ${allScheduledSessions.length} sessions in chunks...`);
            
            // To replace the sequential N+1 query creation of ExamSession, we create them fully concurrently in chunks.
            // We use a chunk size of 100 for Promise.all to avoid overloading connection pool
            const sessionChunkSize = 100;
            for (let i = 0; i < allScheduledSessions.length; i += sessionChunkSize) {
                const sessionChunk = allScheduledSessions.slice(i, i + sessionChunkSize);
                
                // Concurrent creation of sessions in this chunk
                await Promise.all(sessionChunk.map(async (session) => {
                    const sessionId = uuidv4();
                    (session as any)._createdSessionId = sessionId;

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
                            campus: session.campus as any,
                            proctorId: (session as any)._proctorId || null,
                            examParts: { connect: session.examPartIds.map(id => ({ id })) },
                        }
                    });
                }));

                // Now loop over sessionChunk sequentially to prepare child relationships
                let examSeatsChunk: any[] = [];
                let studentExamsChunk: any[] = [];
                let studentExamPartsChunk: any[] = [];
                let proctorAssignmentsChunk: any[] = [];

                for (const session of sessionChunk) {
                    const sessionId = (session as any)._createdSessionId;
                    const proctorId = (session as any)._proctorId;
                    if (proctorId) {
                        proctorAssignmentsChunk.push({
                            id: uuidv4(),
                            proctorId,
                            examSessionId: sessionId,
                            status: 'ASSIGNED',
                            assignedById: proctorId,
                        });
                    }
                    const room = roomMap.get(session.roomId);
                    const maxRows = room?.max_rows || 5;
                    const maxCols = room?.max_columns || 4;
                    const assignedSeats = this.schedulingService.assignSeats(session.studentCodes.length, maxRows, maxCols);

                    for (let j = 0; j < session.studentCodes.length; j++) {
                        const studentCode = session.studentCodes[j].trim();
                        const student = userMap.get(studentCode);
                        if (!student) continue;

                        const seatInfo = assignedSeats[j];
                        const seatId = uuidv4();
                        const studentExamId = uuidv4();
                        const seatIdx = (seatInfo.row - 1) * maxCols + seatInfo.col;

                        examSeatsChunk.push({ id: seatId, examSessionId: sessionId, row: seatInfo.row, col: seatInfo.col, status: 'Assigned' });
                        studentExamsChunk.push({ id: studentExamId, studentId: student.id, examSessionId: sessionId, seatPosition: seatId, seatNumber: seatIdx.toString(), stt: j + 1 });
                        
                        for (const partId of session.examPartIds) {
                            studentExamPartsChunk.push({ id: uuidv4(), studentExamId: studentExamId, examPartId: partId });
                        }
                    }
                }

                // Insert child chunks immediately to avoid memory bloating
                if (examSeatsChunk.length > 0) {
                    for (let k = 0; k < examSeatsChunk.length; k += chunkSize) {
                        await this.prisma.examSeat.createMany({ data: examSeatsChunk.slice(k, k + chunkSize) });
                    }
                }
                
                if (studentExamsChunk.length > 0) {
                    for (let k = 0; k < studentExamsChunk.length; k += chunkSize) {
                        await this.prisma.studentExam.createMany({ data: studentExamsChunk.slice(k, k + chunkSize) });
                    }
                }

                if (studentExamPartsChunk.length > 0) {
                    for (let k = 0; k < studentExamPartsChunk.length; k += chunkSize) {
                        await this.prisma.studentExamPart.createMany({ data: studentExamPartsChunk.slice(k, k + chunkSize) });
                    }
                }

                if (proctorAssignmentsChunk.length > 0) {
                    await this.prisma.proctorAssignment.createMany({
                        data: proctorAssignmentsChunk,
                        skipDuplicates: true,
                    });
                }

                // Yield the event loop to ensure RabbitMQ doesn't timeout
                await new Promise(resolve => setImmediate(resolve));
            }

            this.logger.log(`✅ Successfully generated and saved schedule for all campuses`);

            this.apiEventClient.emit(MESSAGE_PATTERNS.EXAM.AUTO_GENERATE_FINISHED, {
                semesterId: data.semesterId,
                campuses: activeCampuses,
                sessionCount: totalScheduledSessionsCount,
                failedCount: totalFailedPools.length,
                failedItems: totalFailedPools,
                success: true,
                summary: summary
            });

            channel.ack(originalMsg);
        } catch (error) {
            this.logger.error(`❌ Error in schedule generation: ${error.message}`);
            this.logger.error(error.stack);
            channel.ack(originalMsg);
        }
    }

    private async resolveProctors(rawEmails: string[]): Promise<{ id: string; email: string }[]> {
        const emails = Array.from(new Set(
            rawEmails
                .map(email => String(email || '').trim().toLowerCase())
                .filter(email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        ));

        if (emails.length === 0) return [];

        const existingUsers = await this.prisma.user.findMany({
            where: {
                OR: [
                    { email: { in: emails } },
                    { username: { in: emails } },
                ],
            },
        });

        const userByEmail = new Map<string, any>();
        existingUsers.forEach(user => {
            if (user.email) userByEmail.set(user.email.toLowerCase(), user);
            if (user.username) userByEmail.set(user.username.toLowerCase(), user);
        });

        const missingEmails = emails.filter(email => !userByEmail.has(email));
        if (missingEmails.length > 0) {
            await this.prisma.user.createMany({
                data: missingEmails.map(email => ({
                    id: uuidv4(),
                    username: email,
                    email,
                    fullName: email,
                    role: 'PROCTOR',
                    isActive: true,
                })),
                skipDuplicates: true,
            });

            const createdUsers = await this.prisma.user.findMany({
                where: {
                    OR: [
                        { email: { in: missingEmails } },
                        { username: { in: missingEmails } },
                    ],
                },
            });
            createdUsers.forEach(user => {
                if (user.email) userByEmail.set(user.email.toLowerCase(), user);
                if (user.username) userByEmail.set(user.username.toLowerCase(), user);
            });
        }

        return emails
            .map(email => userByEmail.get(email))
            .filter(Boolean)
            .map(user => ({ id: user.id, email: user.email || user.username }));
    }

    private shuffle<T>(items: T[]): T[] {
        const shuffled = [...items];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    private assignConvenientProctors(
        sessions: Array<any>,
        proctors: { id: string; email: string }[],
    ): void {
        if (sessions.length === 0 || proctors.length === 0) return;

        const shuffledProctors = this.shuffle(proctors);
        const proctorState = new Map<string, {
            total: number;
            daySlots: Map<string, Set<number>>;
        }>();

        shuffledProctors.forEach(proctor => {
            proctorState.set(proctor.id, { total: 0, daySlots: new Map() });
        });

        const orderedSessions = [...sessions].sort((a, b) => {
            const weekDiff = (a.weekNum || 0) - (b.weekNum || 0);
            if (weekDiff !== 0) return weekDiff;
            const dayDiff = (a.dayIndex || 0) - (b.dayIndex || 0);
            if (dayDiff !== 0) return dayDiff;
            const slotDiff = (a.slotIndex || 0) - (b.slotIndex || 0);
            if (slotDiff !== 0) return slotDiff;
            return new Date(a.openTime).getTime() - new Date(b.openTime).getTime();
        });

        for (const session of orderedSessions) {
            const dayKey = `${session.weekNum}_${session.dayIndex}`;
            const slotIndex = Number(session.slotIndex || 0);
            const candidates = shuffledProctors
                .filter(proctor => !proctorState.get(proctor.id)?.daySlots.get(dayKey)?.has(slotIndex))
                .map(proctor => {
                    const state = proctorState.get(proctor.id)!;
                    const slots = state.daySlots.get(dayKey) || new Set<number>();
                    const hasSameDayWork = slots.size > 0;
                    const hasAdjacentSlot = slots.has(slotIndex - 1) || slots.has(slotIndex + 1);
                    const nearestGap = hasSameDayWork
                        ? Math.min(...Array.from(slots).map(s => Math.abs(s - slotIndex)))
                        : 0;

                    let score = state.total * 12;
                    score += slots.size * 2;
                    if (hasAdjacentSlot) score -= 16;
                    else if (hasSameDayWork) score += 10 + nearestGap * 4;
                    score += Math.random();

                    return { proctor, score };
                })
                .sort((a, b) => a.score - b.score);

            const selected = candidates[0]?.proctor;
            if (!selected) continue;

            (session as any)._proctorId = selected.id;
            const state = proctorState.get(selected.id)!;
            state.total += 1;
            if (!state.daySlots.has(dayKey)) state.daySlots.set(dayKey, new Set<number>());
            state.daySlots.get(dayKey)!.add(slotIndex);
        }
    }

    private parseCsv(base64Data: string, campus?: Campus): { studentCode: string; subjectCode: string; examType?: string; date?: string; slot?: number; scheduleId?: string; login?: string; online?: string }[] {
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
                scheduleId: item.ScheduleID ? String(item.ScheduleID) : undefined,
                login: item.Login ? String(item.Login).trim() : '',
                online: item.Online ? String(item.Online).trim() : ''
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
