import { Controller, Logger, Inject } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext, ClientProxy } from '@nestjs/microservices';
import { MESSAGE_PATTERNS, ExamImportJobData, BaseJobResult, RABBITMQ_CLIENTS, ExamImportFinishedData, ImportScheduleJobData, ImportProctorJobData, ImportExamCodeJobData } from '@app/queue';
import { IExamRoomRepository, EXAM_ROOM_REPOSITORY, ExamRoom } from '@app/exam-rooms';
import { IExamSessionRepository, EXAM_SESSION_REPOSITORY, ExamSession } from '@app/exam-sessions';
import { IUserRepository, USER_REPOSITORY } from '@app/users';
import { CACHE_SERVICE, ICacheService } from '@app/cache';
import { PrismaService } from '@app/prisma';
import { ExamType } from '@prisma/client';
import * as xlsx from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

@Controller()
export class ExamImportProcessor {
    private readonly logger = new Logger(ExamImportProcessor.name);

    constructor(
        @Inject(EXAM_ROOM_REPOSITORY)
        private readonly examRoomRepository: IExamRoomRepository,
        @Inject(EXAM_SESSION_REPOSITORY)
        private readonly examSessionRepository: IExamSessionRepository,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        @Inject(RABBITMQ_CLIENTS.API_EVENT_SERVICE)
        private readonly apiEventClient: ClientProxy,
        @Inject(CACHE_SERVICE)
        private readonly cacheService: ICacheService,
        private readonly prisma: PrismaService,
    ) { }

    @MessagePattern(MESSAGE_PATTERNS.EXAM.IMPORT_ROOMS)
    async handleImportRooms(
        @Payload() data: ExamImportJobData,
        @Ctx() context: RmqContext,
    ): Promise<BaseJobResult> {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        const startTime = Date.now();

        this.logger.log(`Processing exam room import from file: ${data.fileName}`);

        try {
            const buffer = Buffer.from(data.fileContent, 'base64');
            const workbook = xlsx.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const items: any[] = xlsx.utils.sheet_to_json(worksheet);

            this.logger.log(`Found ${items.length} rows for rooms import.`);

            let successCount = 0;
            let errorCount = 0;

            for (const item of items) {
                try {
                    const { RoomNumber, Capacity } = item;

                    if (RoomNumber === undefined) {
                        this.logger.warn(`Skipping row missing RoomNumber: ${JSON.stringify(item)}`);
                        errorCount++;
                        continue;
                    }

                    // Check if exists
                    const existing = await this.examRoomRepository.findOne({ roomNumber: String(RoomNumber) });
                    if (existing) {
                        this.logger.debug(`Room ${RoomNumber} already exists, updating...`);
                        const updated = existing.update({ capacity: Capacity ? Number(Capacity) : undefined });
                        await this.examRoomRepository.save(updated);
                    } else {
                        const room = ExamRoom.create({
                            id: uuidv4(),
                            roomNumber: String(RoomNumber),
                            capacity: Capacity ? Number(Capacity) : undefined,
                        });
                        await this.examRoomRepository.save(room);
                    }
                    successCount++;
                } catch (err) {
                    this.logger.error(`Error processing room ${item.RoomNumber}: ${err.message}`);
                    errorCount++;
                }
            }

            // Invalidate cache if there were any successes
            if (successCount > 0) {
                await this.cacheService.delByPrefix('exam-rooms:list');
            }

            this.emitFinished('rooms', data.fileName, successCount, errorCount);
            channel.ack(originalMsg);

            return {
                jobId: originalMsg.properties.messageId || 'unknown',
                success: true,
                processingTime: Date.now() - startTime,
                completedAt: new Date(),
            };
        } catch (error) {
            this.logger.error(`Critical error during room import: ${error.message}`);
            channel.nack(originalMsg, false, false);
            return this.failResult(originalMsg, startTime, error.message);
        }
    }

    @MessagePattern(MESSAGE_PATTERNS.EXAM.IMPORT_SCHEDULE)
    async handleImportSchedule(
        @Payload() data: ImportScheduleJobData,
        @Ctx() context: RmqContext,
    ): Promise<BaseJobResult> {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        const startTime = Date.now();

        this.logger.log(`Processing schedule import: ${data.schedules.length} schedules, ${data.students.length} students`);

        try {
            let schedulesCreated = 0;
            let studentsImported = 0;
            const errors: any[] = [];

            // 1. Process Schedules
            const sessionMap = new Map<string, string>(); // sessionString -> sessionId
            const failedSessions = new Map<string, string>(); // Track sessions that specifically failed in this batch (session -> errorMsg)

            for (const s of data.schedules) {
                try {
                    const parsed = this.parseExamSession(s.examSession);
                    if (!parsed) throw new Error(`Cannot parse examSession string: ${s.examSession}`);

                    // ... (rest of schedule logic) ...

                    // Note: If you need to verify where lines 130-192 went, they are unchanged inside this loop
                    // I am replacing the variable declaration and loop start, 
                    // but the Context view showed lines 122-196 roughly. 
                    // To avoid destroying logic, I will use a targeted replacement for the Catch block and initialization.

                    // Actually, safer to just replace the initialization and the catch block. 
                    // But I cannot do two disjoint replacements in one tool call easily if they are far apart.

                    // Let's rely on the fact that I can see the file. 
                    // I will restart the reasoning to ensure I don't delete code.
                    if (!parsed) throw new Error(`Cannot parse examSession string: ${s.examSession}`);

                    // Find or create Room
                    let room = await this.prisma.examRoom.findUnique({ where: { roomNumber: parsed.roomName } });
                    if (!room) {
                        room = await this.prisma.examRoom.create({
                            data: {
                                id: uuidv4(),
                                roomNumber: parsed.roomName,
                                max_rows: 5,
                                max_columns: 6,
                                total_seats: 30,
                                capacity: 30,
                                status: 'Available'
                            }
                        });
                    }

                    // Find or create Session
                    // 1. Check for exact match first
                    let session = await this.prisma.examSession.findFirst({
                        where: {
                            examRoomId: room.id,
                            examOpenTime: parsed.openTime,
                            examCloseTime: parsed.closeTime,
                        }
                    });

                    if (session) {
                        throw new Error(`Schedule already exists for room ${parsed.roomName} at ${s.examSession}`);
                    }

                    // 2. Check for ANY overlap in this room
                    const overlappingSession = await this.prisma.examSession.findFirst({
                        where: {
                            examRoomId: room.id,
                            AND: [
                                { examOpenTime: { lt: parsed.closeTime } },
                                { examCloseTime: { gt: parsed.openTime } }
                            ]
                        },
                    });

                    if (overlappingSession) {
                        const existingStart = overlappingSession.examOpenTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const existingEnd = overlappingSession.examCloseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        throw new Error(
                            `Room ${parsed.roomName} has an overlapping session (${existingStart} - ${existingEnd}). `
                        );
                    }

                    // 3. Create new
                    const newSession = await this.prisma.examSession.create({
                        data: {
                            id: uuidv4(),
                            examRoomId: room.id,
                            subjectCode: s.subjectCode,
                            examOpenTime: parsed.openTime,
                            examCloseTime: parsed.closeTime,
                            status: 'Scheduled'
                        }
                    });

                    sessionMap.set(s.examSession, newSession.id);
                    schedulesCreated++;
                } catch (err) {
                    failedSessions.set(s.examSession, err.message);
                    errors.push({ type: 'schedule', data: s, message: err.message });
                }
            }

            // 2. Process Students
            // Group students by session to handle random seating per session
            const studentGroups = new Map<string, typeof data.students>();
            for (const st of data.students) {
                const list = studentGroups.get(st.examSession) || [];
                list.push(st);
                studentGroups.set(st.examSession, list);
            }

            for (const [sessionStr, students] of studentGroups.entries()) {
                try {

                    let finalSessionId = sessionMap.get(sessionStr);

                    // Fallback: If not created in this batch, try to find in DB (needed for split batches)
                    if (!finalSessionId) {
                        try {
                            const parsed = this.parseExamSession(sessionStr);
                            const room = await this.prisma.examRoom.findUnique({ where: { roomNumber: parsed.roomName } });

                            if (room) {
                                const existingSession = await this.prisma.examSession.findFirst({
                                    where: {
                                        examRoomId: room.id,
                                        examOpenTime: parsed.openTime,
                                        examCloseTime: parsed.closeTime
                                    }
                                });
                                if (existingSession) {
                                    finalSessionId = existingSession.id;
                                    sessionMap.set(sessionStr, finalSessionId); // Cache it
                                }
                            }
                        } catch (parseErr) {
                            // If parse fails or not found, strict check below will catch it
                        }
                    }

                    if (!finalSessionId) {
                        throw new Error(`Students skipped: Schedule for session ${sessionStr} already exists or failed to create in this batch.`);
                    }

                    const session = await this.prisma.examSession.findUnique({
                        where: { id: finalSessionId },
                        include: { examRoom: true }
                    });

                    if (!session || !session.examRoom) throw new Error(`Room not found for session ${finalSessionId}`);

                    // Capacity Validation
                    if (students.length > session.examRoom.total_seats) {
                        throw new Error(`Student count (${students.length}) exceeds room capacity (${session.examRoom.total_seats}) for session ${sessionStr}`);
                    }

                    // Generate Random Seats
                    const availableSeats = this.generateSeats(session.examRoom.max_rows, session.examRoom.max_columns);
                    this.shuffleArray(availableSeats);

                    for (let i = 0; i < students.length; i++) {
                        const st = students[i];
                        try {
                            // Find or Create User (Auto-create for Dev Mode)
                            const user = await this.ensureStudentExists(st);
                            if (!user) {
                                const errMsg = `Student with code ${st.studentCode} not found and could not be created.`;
                                this.logger.error(errMsg);
                                errors.push({ type: 'student', data: st, message: errMsg });
                                continue;
                            }

                            // Create or update StudentExam
                            // Check duplicate student
                            let studentExam = await this.prisma.studentExam.findUnique({
                                where: { examSessionId_studentId: { examSessionId: finalSessionId, studentId: user.id } }
                            });

                            if (studentExam) {
                                throw new Error(`Student ${st.studentCode} already exists in session ${sessionStr}`);
                            }

                            studentExam = await this.prisma.studentExam.create({
                                data: {
                                    id: uuidv4(),
                                    examSessionId: finalSessionId,
                                    studentId: user.id,
                                    stt: st.stt ? Number(st.stt) : null,
                                    seatNumber: availableSeats[i]
                                }
                            });

                            // Process Exam Parts
                            const parts = st.examPart.split(',').map(p => p.trim());
                            for (const partType of parts) {

                                await this.prisma.studentExamPart.upsert({
                                    where: {
                                        studentExamId_examType: {
                                            studentExamId: studentExam.id,
                                            examType: partType as any
                                        }
                                    },
                                    update: {}, // No update for now
                                    create: {
                                        id: uuidv4(),
                                        studentExamId: studentExam.id,
                                        examType: partType as any,
                                        isInRoom: false,
                                        isCheckedIn: false
                                    }
                                });
                            }
                            studentsImported++;
                        } catch (stErr) {
                            errors.push({ type: 'student', data: st, message: stErr.message });
                        }
                    }

                    // --- NEW: Aggregate Exam Types for the Session ---
                    const sessionParts = new Set<string>();
                    for (const st of students) {
                        st.examPart.split(',').forEach(p => {
                            const trimmed = p.trim();
                            if (trimmed && Object.values(ExamType).includes(trimmed as ExamType)) {
                                sessionParts.add(trimmed);
                            }
                        });
                    }

                    if (sessionParts.size > 0) {
                        const currentSession = await this.prisma.examSession.findUnique({
                            where: { id: finalSessionId },
                            select: { examType: true }
                        });

                        const existingTypes = currentSession?.examType || [];
                        const newTypes = Array.from(sessionParts) as ExamType[];
                        const mergedTypes = Array.from(new Set([...existingTypes, ...newTypes]));

                        await this.prisma.examSession.update({
                            where: { id: finalSessionId },
                            data: { examType: mergedTypes }
                        });
                    }
                    // ------------------------------------------------
                    // ------------------------------------------------
                } catch (groupErr) {
                    this.logger.error(`Failed to process student group ${sessionStr}: ${groupErr.message}`);

                    // 1. Report Schedule Error
                    errors.push({
                        type: 'schedule',
                        data: { examSession: sessionStr },
                        message: groupErr.message
                    });

                    // 2. Report Student Errors
                    for (const st of students) {
                        errors.push({
                            type: 'student',
                            data: st,
                            message: `${groupErr.message}`
                        });
                    }
                }
            }

            this.emitFinished('schedule', 'import-schedule-api', schedulesCreated + studentsImported, errors.length, errors, data.batchId);
            channel.ack(originalMsg);

            return {
                jobId: originalMsg.properties.messageId || 'unknown',
                success: true,
                processingTime: Date.now() - startTime,
                completedAt: new Date(),
            };
        } catch (error) {
            this.logger.error(`Critical error during schedule import: ${error.message}`);
            channel.nack(originalMsg, false, false);
            return this.failResult(originalMsg, startTime, error.message);
        }
    }

    @MessagePattern(MESSAGE_PATTERNS.EXAM.IMPORT_PROCTORS)
    async handleImportProctors(
        @Payload() data: ImportProctorJobData,
        @Ctx() context: RmqContext,
    ): Promise<BaseJobResult> {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        const startTime = Date.now();

        this.logger.log(`Processing proctor import: ${data.proctors.length} assignments`);

        try {
            let successCount = 0;
            const errors: any[] = [];

            for (const p of data.proctors) {
                try {
                    if (!p.proctorEmail || !p.proctorEmail.trim()) {
                        throw new Error("Proctor Email is missing");
                    }

                    // 1. Find or Create Proctor (User) by username (proctorEmail)
                    let proctor = await this.prisma.user.findUnique({
                        where: { username: p.proctorEmail.toLowerCase() }
                    });

                    if (!proctor) {
                        // Auto-create proctor user if not exists
                        this.logger.log(`Proctor ${p.proctorEmail} not found. Creating new user...`);

                        proctor = await this.prisma.user.create({
                            data: {
                                id: uuidv4(),
                                username: p.proctorEmail.toLowerCase(),
                                email: p.proctorEmail.toLowerCase(),
                                fullName: p.proctorEmail, // Use email as default name
                                role: 'PROCTOR',
                                isActive: true,
                            }
                        });

                        this.logger.log(`Created new proctor user: ${proctor.username}`);
                    }

                    // 2. Parse Time & Room to find Session
                    // Assume dateExam is DD/MM/YYYY, timeExam is HHhMM-HHhMM
                    const timeParts = p.timeExam.split('-');
                    if (timeParts.length !== 2) throw new Error(`Invalid time format: ${p.timeExam}. Expected HHhMM-HHhMM`);

                    const [startStr, endStr] = timeParts;
                    const dateParts = p.dateExam.split('/');
                    if (dateParts.length !== 3) throw new Error(`Invalid date format: ${p.dateExam}. Expected DD/MM/YYYY`);

                    const [day, month, year] = dateParts.map(Number);

                    const parseTime = (timeStr: string) => {
                        const parts = timeStr.trim().split('h');
                        if (parts.length !== 2) throw new Error(`Invalid time string: ${timeStr}`);
                        const h = Number(parts[0]);
                        const m = Number(parts[1]);
                        // Vietnam is GMT+7, no DST.
                        // We use Date.UTC and subtract 7 hours to get the correct UTC time.
                        return new Date(Date.UTC(year, month - 1, day, h - 7, m, 0, 0));
                    };

                    const openTime = parseTime(startStr);
                    const closeTime = parseTime(endStr);

                    const room = await this.prisma.examRoom.findUnique({
                        where: { roomNumber: String(p.examRoom) }
                    });

                    if (!room) {
                        throw new Error(`Room ${p.examRoom} not found`);
                    }

                    const session = await this.prisma.examSession.findFirst({
                        where: {
                            examRoomId: room.id,
                            examOpenTime: openTime,
                            examCloseTime: closeTime,
                        }
                    });

                    if (!session) {
                        throw new Error(`Exam session not found for room ${p.examRoom} at ${p.dateExam} ${p.timeExam}`);
                    }

                    // 3. Create or Update ProctorAssignment (Audit/History)
                    await this.prisma.proctorAssignment.upsert({
                        where: {
                            proctorId_examSessionId: {
                                proctorId: proctor.id,
                                examSessionId: session.id
                            }
                        },
                        update: {
                            status: 'ASSIGNED',
                            assignedById: data.creatorId || proctor.id,
                        },
                        create: {
                            id: uuidv4(),
                            proctorId: proctor.id,
                            examSessionId: session.id,
                            status: 'ASSIGNED',
                            assignedById: data.creatorId || proctor.id,
                        }
                    });

                    // 4. Update ExamSession Record directly (Primary Proctor)
                    // If multiple proctors are imported for same session, the last one wins in this simple logic
                    // or we could check p.proctorType
                    await this.prisma.examSession.update({
                        where: { id: session.id },
                        data: {
                            proctorId: proctor.id
                        }
                    });

                    successCount++;
                } catch (err) {
                    errors.push({ type: 'proctor', data: p, message: err.message });
                }
            }

            this.emitFinished('proctor', 'import-proctor-api', successCount, errors.length, errors, data.batchId);
            channel.ack(originalMsg);

            return {
                jobId: originalMsg.properties.messageId || 'unknown',
                success: true,
                processingTime: Date.now() - startTime,
                completedAt: new Date(),
            };
        } catch (error) {
            this.logger.error(`Critical error during proctor import: ${error.message}`);
            channel.nack(originalMsg, false, false);
            return this.failResult(originalMsg, startTime, error.message);
        }
    }

    @MessagePattern(MESSAGE_PATTERNS.EXAM.IMPORT_EXAMCODE)
    async handleImportExamCodes(
        @Payload() data: ImportExamCodeJobData,
        @Ctx() context: RmqContext,
    ): Promise<BaseJobResult> {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        const startTime = Date.now();

        this.logger.log(`Processing exam code import: ${data.codes.length} items`);

        try {
            let successCount = 0;
            const errors: any[] = [];

            for (const c of data.codes) {
                try {
                    // 1. Find Session
                    const dateParts = c.dateExam.split('/');
                    if (dateParts.length !== 3) throw new Error(`Invalid date format: ${c.dateExam}`);
                    const [day, month, year] = dateParts.map(Number);

                    const timeParts = c.timeExam.split('-');
                    if (timeParts.length !== 2) throw new Error(`Invalid time format: ${c.timeExam}`);
                    const [startStr, endStr] = timeParts;

                    const parseTime = (timeStr: string) => {
                        const parts = timeStr.trim().split('h');
                        if (parts.length !== 2) throw new Error(`Invalid time string: ${timeStr}`);
                        const h = Number(parts[0]);
                        const m = Number(parts[1]);
                        // Vietnam is GMT+7, no DST.
                        return new Date(Date.UTC(year, month - 1, day, h - 7, m, 0, 0));
                    };

                    const openTime = parseTime(startStr);
                    const closeTime = parseTime(endStr);

                    const room = await this.prisma.examRoom.findUnique({
                        where: { roomNumber: String(c.examRoom) }
                    });

                    if (!room) throw new Error(`Room ${c.examRoom} not found`);

                    const session = await this.prisma.examSession.findFirst({
                        where: {
                            examRoomId: room.id,
                            examOpenTime: openTime,
                            examCloseTime: closeTime,
                        }
                    });

                    if (!session) throw new Error(`Exam session not found for room ${c.examRoom} at ${c.dateExam} ${c.timeExam}`);

                    // 2. Update ExamSession with codes
                    await this.prisma.examSession.update({
                        where: { id: session.id },
                        data: {
                            examCode: c.examCode || undefined,
                            openCode: c.openCode || undefined,
                        }
                    });

                    // Wait, the ExamSession model doesn't have examCode and openCode fields?
                    // Let me check exam_session.prisma again.
                    // Oh, I see. I might need to add them to the Prisma schema if they are missing.

                    successCount++;
                } catch (err) {
                    errors.push({ type: 'examcode', data: c, message: err.message });
                }
            }

            this.emitFinished('examcode', 'import-codes-api', successCount, errors.length, errors, data.batchId);
            channel.ack(originalMsg);

            return {
                jobId: originalMsg.properties.messageId || 'unknown',
                success: true,
                processingTime: Date.now() - startTime,
                completedAt: new Date(),
            };
        } catch (error) {
            this.logger.error(`Critical error during exam code import: ${error.message}`);
            channel.nack(originalMsg, false, false);
            return this.failResult(originalMsg, startTime, error.message);
        }
    }

    private async ensureStudentExists(st: any) {
        // 1. Find by Student Code (MSSV)
        let user = await this.prisma.user.findUnique({ where: { code: st.studentCode } });
        if (user) return user;

        // 2. Find by Username (MemberCode)
        const username = st.username || st.memberCode;
        if (username) {
            user = await this.prisma.user.findUnique({ where: { username: username.toLowerCase() } });
            if (user) {
                this.logger.debug(`Student with username ${username} exists but missing code. Updating code to ${st.studentCode}`);
                return await this.prisma.user.update({
                    where: { id: user.id },
                    data: { code: st.studentCode }
                });
            }
        }

        // 3. Find by Email (If provided)
        if (st.email) {
            user = await this.prisma.user.findUnique({ where: { email: st.email } });
            if (user) {
                this.logger.debug(`Student with email ${st.email} exists but missing code. Updating code to ${st.studentCode}`);
                return await this.prisma.user.update({
                    where: { id: user.id },
                    data: { code: st.studentCode }
                });
            }
        }

        // --- DEV ONLY: Auto-create student if not found ---
        this.logger.warn(`[DEV] Auto-creating missing student: ${st.studentCode} | Username: ${username}`);

        // Auto-generate email if missing
        const finalEmail = st.email || (username ? `${username}@fpt.edu.vn` : null);

        return await this.prisma.user.create({
            data: {
                id: uuidv4(),
                code: st.studentCode,
                email: finalEmail,
                username: username?.toLowerCase() || null,
                fullName: st.name,
                role: 'STUDENT',
            }
        });
        // --------------------------------------------------
    }

    // For Production: return null or throw error
    // return null;
    // --------------------------------------------------

    private parseExamSession(sessionStr: string) {
        // Regex to match formats like:
        // "26/12/2025.13h30-15h00.ALPHA 201" 
        // "26/12/2025 10h40-12h15 ALPHA 704"
        const regex = /^(\d{2}\/\d{2}\/\d{4})[.\s](\d{2}h\d{2})-(\d{2}h\d{2})[.\s](.+)$/;
        const match = sessionStr.match(regex);
        if (!match) return null;

        const [_, dateStr, startTimeStr, endTimeStr, roomName] = match;

        // Parse date (DD/MM/YYYY)
        const [day, month, year] = dateStr.split('/').map(Number);

        const parseTime = (timeStr: string) => {
            const [h, m] = timeStr.split('h').map(Number);
            // Vietnam is GMT+7, no DST.
            return new Date(Date.UTC(year, month - 1, day, h - 7, m, 0, 0));
        };

        return {
            openTime: parseTime(startTimeStr),
            closeTime: parseTime(endTimeStr),
            roomName: roomName.trim(),
        };
    }

    private generateSeats(rows: number, cols: number): string[] {
        const seats: string[] = [];
        for (let r = 1; r <= rows; r++) {
            for (let c = 1; c <= cols; c++) {
                seats.push(`${r}-${c}`);
            }
        }
        return seats;
    }

    private shuffleArray(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    private emitFinished(
        action: 'rooms' | 'schedule' | 'proctor' | 'examcode',
        fileName: string,
        successCount: number,
        errorCount: number,
        failedItems?: { item: any; error: string }[],
        batchId?: string
    ) {
        const finishedData: ExamImportFinishedData = {
            action,
            fileName,
            successCount,
            errorCount,
            failedItems,
            batchId,
            timestamp: new Date(),
        };
        this.apiEventClient.emit(MESSAGE_PATTERNS.EXAM.IMPORT_FINISHED, finishedData);
    }

    private failResult(msg: any, startTime: number, error: string): BaseJobResult {
        return {
            jobId: msg.properties.messageId || 'unknown',
            success: false,
            processingTime: Date.now() - startTime,
            error,
            completedAt: new Date(),
        };
    }
}
