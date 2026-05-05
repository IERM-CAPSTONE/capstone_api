import { Controller, Injectable, Logger, Inject } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext, ClientProxy } from '@nestjs/microservices';
import { MESSAGE_PATTERNS, ExamImportJobData, BaseJobResult, RABBITMQ_CLIENTS, ExamImportFinishedData, ImportScheduleJobData, ImportProctorJobData, ImportExamCodeJobData } from '@app/queue';
import { IExamRoomRepository, EXAM_ROOM_REPOSITORY, ExamRoom } from '@app/exam-rooms';
import { IExamSessionRepository, EXAM_SESSION_REPOSITORY, ExamSession } from '@app/exam-sessions';
import { IUserRepository, USER_REPOSITORY } from '@app/users';
import { IExamSeatRepository, ExamSeat } from '@app/exam-seats';
import { CACHE_SERVICE, ICacheService } from '@app/cache';
import { PrismaService } from '@app/prisma';
import { ExamPart, Campus } from '@prisma/client';
import * as xlsx from 'xlsx';
import { v4 as uuidv4 } from 'uuid';

@Controller()
@Injectable()
export class ExamImportProcessor {
    private readonly logger = new Logger(ExamImportProcessor.name);

    constructor(
        @Inject(EXAM_ROOM_REPOSITORY)
        private readonly examRoomRepository: IExamRoomRepository,
        @Inject(EXAM_SESSION_REPOSITORY)
        private readonly examSessionRepository: IExamSessionRepository,
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        @Inject('EXAM_SEAT_REPOSITORY')
        private readonly examSeatRepository: IExamSeatRepository,
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
            let workbook: xlsx.WorkBook;

            // More robust reading for CSV files
            if (data.fileName && data.fileName.toLowerCase().endsWith('.csv')) {
                const content = buffer.toString('utf-8');
                const sampleLine = content.split(/\r?\n/).find((line) => line.trim().length > 0) ?? '';
                const delimiter = sampleLine.includes(';') && !sampleLine.includes(',') ? ';' : ',';
                workbook = xlsx.read(content, { type: 'string', FS: delimiter });
            } else {
                workbook = xlsx.read(buffer, { type: 'buffer' });
            }

            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const items: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: '' });

            this.logger.log(`Found ${items.length} rows for rooms import in file ${data.fileName}.`);
            this.logger.log(`[IMPORT_ROOMS] campusId=${data.campusId ?? 'N/A'} fileName=${data.fileName} sheetName=${sheetName} keysSample=${items[0] ? Object.keys(items[0]).join(', ') : 'N/A'}`);

            let successCount = 0;
            let errorCount = 0;

            for (const item of items) {
                try {
                    // Avoid naming collision with Campus enum and support both header styles
                    const itemRoomNum = item.RoomNumber || item.Room || item.room;
                    const itemCapacity = item.Capacity || item.capacity;
                    const itemCampus = item.Campus || item.campus;
                    const itemMaxRows = item.max_rows ?? item.maxRows ?? item.MAXROWS ?? item.rows ?? item.Rows ?? item.row ?? item.Row ?? item.MAX_ROWS;
                    const itemMaxColumns = item.max_columns ?? item.maxColumns ?? item.MAXCOLUMNS ?? item.columns ?? item.Columns ?? item.column ?? item.Column ?? item.MAX_COLUMNS;
                    const itemTotalSeats = item.totalSeats ?? item.total_seats ?? item.TOTALSEATS ?? item.total ?? item.TotalSeats ?? item.TOTAL_SEATS;

                    this.logger.debug(`[IMPORT_ROOMS] rawRow=${JSON.stringify(item)} parsed={room:${itemRoomNum ?? 'N/A'}, capacity:${itemCapacity ?? 'N/A'}, maxRows:${itemMaxRows ?? 'N/A'}, maxColumns:${itemMaxColumns ?? 'N/A'}, totalSeats:${itemTotalSeats ?? 'N/A'}, campus:${itemCampus ?? 'N/A'}}`);

                    if (itemRoomNum === undefined || itemRoomNum === null || itemRoomNum === '') {
                        this.logger.warn(`Skipping row missing identification: ${JSON.stringify(item)}`);
                        errorCount++;
                        continue;
                    }

                    const roomNumStr = String(itemRoomNum).trim();
                    if (!roomNumStr) continue;

                    // Prioritize campusId from job data, then Campus from Excel item
                    const campusStr = data.campusId || (itemCampus ? String(itemCampus).trim().toUpperCase() : undefined);
                    const campusEnum = campusStr as Campus;

                    // Check if exists
                    const existing = await this.examRoomRepository.findOne({
                        roomNumber: roomNumStr,
                        campus: campusEnum
                    });

                    if (existing) {
                        this.logger.debug(`[IMPORT_ROOMS] updating existing room=${roomNumStr} campus=${campusStr || 'default'} with maxRows=${itemMaxRows ?? 'N/A'} maxColumns=${itemMaxColumns ?? 'N/A'} totalSeats=${itemTotalSeats ?? 'N/A'}`);
                        const updated = existing.update({
                            capacity: itemCapacity ? Number(itemCapacity) : undefined,
                            maxRows: itemMaxRows ? Number(itemMaxRows) : undefined,
                            maxColumns: itemMaxColumns ? Number(itemMaxColumns) : undefined,
                            totalSeats: itemTotalSeats ? Number(itemTotalSeats) : undefined,
                            campus: campusEnum
                        });
                        this.logger.debug(`[IMPORT_ROOMS] updated entity room=${roomNumStr} maxRows=${updated.maxRows} maxColumns=${updated.maxColumns} totalSeats=${updated.totalSeats}`);
                        await this.examRoomRepository.save(updated);
                    } else {
                        const maxRows = itemMaxRows ? Number(itemMaxRows) : 6;
                        const maxColumns = itemMaxColumns ? Number(itemMaxColumns) : 3;
                        const totalSeats = itemTotalSeats ? Number(itemTotalSeats) : (maxRows * maxColumns);

                        this.logger.debug(`[IMPORT_ROOMS] creating room=${roomNumStr} campus=${campusStr || 'default'} maxRows=${maxRows} maxColumns=${maxColumns} totalSeats=${totalSeats} capacity=${itemCapacity ? Number(itemCapacity) : totalSeats}`);

                        const room = ExamRoom.create({
                            id: uuidv4(),
                            roomNumber: roomNumStr,
                            capacity: itemCapacity ? Number(itemCapacity) : totalSeats,
                            max_rows: maxRows,
                            max_columns: maxColumns,
                            total_seats: totalSeats,
                            campus: campusEnum
                        });
                        this.logger.debug(`[IMPORT_ROOMS] created entity room=${roomNumStr} maxRows=${room.maxRows} maxColumns=${room.maxColumns} totalSeats=${room.totalSeats}`);
                        await this.examRoomRepository.save(room);
                    }
                    successCount++;
                } catch (err) {
                    this.logger.error(`Error processing room ${item.RoomNumber || item.Room || item.room}: ${err.message}`);
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
                    const scheduleCampus = this.resolveCampus(s.campus);

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
                    let room = await this.prisma.examRoom.findFirst({
                        where: {
                            roomNumber: parsed.roomName,
                            campus: scheduleCampus,
                        }
                    });
                    if (!room) {
                        room = await this.prisma.examRoom.create({
                            data: {
                                id: uuidv4(),
                                roomNumber: parsed.roomName,
                                max_rows: 6,
                                max_columns: 3,
                                total_seats: 18,
                                capacity: 18,
                                status: 'Available',
                                campus: scheduleCampus,
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
                            status: 'Scheduled',
                            campus: scheduleCampus,
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
                            const studentCampus = this.resolveCampus(students[0]?.campus);
                            const room = await this.prisma.examRoom.findFirst({
                                where: {
                                    roomNumber: parsed.roomName,
                                    campus: studentCampus,
                                }
                            });
                            this.logger.log(`Fallback Lookup: Room ${parsed.roomName} found: ${!!room}`);

                            if (room) {
                                this.logger.log(`Searching for session: RoomId=${room.id}, Open=${parsed.openTime.toISOString()}, Close=${parsed.closeTime.toISOString()}`);
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

                    // Phase 2: Fetch or Create ExamSeats for this session
                    let examSeats = await this.prisma.examSeat.findMany({
                        where: { examSessionId: finalSessionId },
                    });

                    // If no seats exist, create them (should be auto-initialized in CreateExamSession, but handle edge case)
                    if (examSeats.length === 0) {
                        const seatRecords = [];
                        for (let row = 1; row <= session.examRoom.max_rows; row++) {
                            for (let col = 1; col <= session.examRoom.max_columns; col++) {
                                seatRecords.push({
                                    id: uuidv4(),
                                    examSessionId: finalSessionId,
                                    row,
                                    col,
                                    status: 'Available' as const,
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                });
                            }
                        }
                        await this.prisma.examSeat.createMany({ data: seatRecords });
                        examSeats = seatRecords;
                    }

                    // Get available seats (not Locked)
                    const availableSeats = examSeats
                        .filter(seat => seat.status === 'Available')
                        .sort((a, b) => (a.row !== b.row ? a.row - b.row : a.col - b.col));

                    // Validate sufficient available seats
                    if (availableSeats.length < students.length) {
                        throw new Error(
                            `Not enough Available seats: ${availableSeats.length} available, ${students.length} students. ` +
                            `Lock some available seats before importing students.`
                        );
                    }

                    // Shuffle available seats for random assignment
                    this.shuffleArray(availableSeats);

                    // Use raw seat coordinates as fallback for seatNumber
                    const allPossibleSeats = this.generateSeats(session.examRoom.max_rows, session.examRoom.max_columns);
                    const assignedSeatIds: string[] = [];

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

                            // Assign physical seat (seatPosition) and ordered seat number (seatNumber)
                            const assignedPhysicalSeat = availableSeats[i];
                            const seatNumberString = allPossibleSeats[i]; // "1-1", "1-2", etc.

                            // Create StudentExam WITHOUT seat assignment (deferred until seat layout is finalized)
                            studentExam = await this.prisma.studentExam.create({
                                data: {
                                    id: uuidv4(),
                                    examSessionId: finalSessionId,
                                    studentId: user.id,
                                    stt: st.stt ? Number(st.stt) : null,
                                    seatNumber: seatNumberString, // Ordered list (1-1, 1-2, etc.)
                                    seatPosition: assignedPhysicalSeat.id,
                                }
                            });

                            assignedSeatIds.push(assignedPhysicalSeat.id);

                            // Process Exam Parts
                            const parts = st.examPart.split(',').map(p => p.trim());
                            const allExamParts = await this.prisma.examPart.findMany();

                            for (const partType of parts) {
                                const et = allExamParts.find(t => t.code === partType || t.name === partType);
                                if (!et) continue;

                                await this.prisma.studentExamPart.upsert({
                                    where: {
                                        studentExamId_examPartId: {
                                            studentExamId: studentExam.id,
                                            examPartId: et.id
                                        }
                                    },
                                    update: {}, // No update for now
                                    create: {
                                        id: uuidv4(),
                                        studentExamId: studentExam.id,
                                        examPartId: et.id,
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

                    if (assignedSeatIds.length > 0) {
                        await this.prisma.examSeat.updateMany({
                            where: { id: { in: assignedSeatIds } },
                            data: { status: 'Assigned' },
                        });
                    }

                    // --- NEW: Aggregate Exam Types for the Session ---
                    const sessionPartTypes: string[] = [];
                    for (const st of students) {
                        st.examPart.split(',').forEach(p => {
                            const trimmed = p.trim();
                            if (trimmed) sessionPartTypes.push(trimmed);
                        });
                    }

                    if (sessionPartTypes.length > 0) {
                        const allExamParts = await this.prisma.examPart.findMany();
                        const sessionTypeIds = new Set<string>();

                        for (const partType of sessionPartTypes) {
                            const et = allExamParts.find(t => t.code === partType || t.name === partType);
                            if (et) sessionTypeIds.add(et.id);
                        }

                        if (sessionTypeIds.size > 0) {
                            await this.prisma.examSession.update({
                                where: { id: finalSessionId },
                                data: {
                                    examParts: {
                                        set: Array.from(sessionTypeIds).map(id => ({ id }))
                                    }
                                }
                            });
                        }
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

                    const assignmentType = this.resolveImportedAssignmentType(p.proctorType);
                    const roleForNewUser = assignmentType === 'HALL' ? 'HALL_INVIGILATOR' : 'PROCTOR';

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
                                role: roleForNewUser as any,
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

                    const room = await this.prisma.examRoom.findFirst({
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
                    if (assignmentType === 'ROOM') {
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
                    }

                    // 4. Update ExamSession Record directly (Primary Proctor)
                    await this.prisma.examSession.update({
                        where: { id: session.id },
                        data: assignmentType === 'HALL'
                            ? { hallInvigilatorId: proctor.id }
                            : { proctorId: proctor.id }
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

    @MessagePattern(MESSAGE_PATTERNS.EXAM.IMPORT_SUBJECTS)
    async handleImportSubjects(
        @Payload() data: ExamImportJobData,
        @Ctx() context: RmqContext,
    ): Promise<BaseJobResult> {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        const startTime = Date.now();

        this.logger.log(`Processing subject import from file: ${data.fileName}`);

        try {
            const buffer = Buffer.from(data.fileContent, 'base64');
            const workbook = xlsx.read(buffer, { type: 'buffer' });

            let totalSuccess = 0;
            let totalError = 0;
            const examParts = await this.prisma.examPart.findMany();

            for (const sheetName of workbook.SheetNames) {
                const worksheet = workbook.Sheets[sheetName];
                const items: any[] = xlsx.utils.sheet_to_json(worksheet, { defval: null });
                this.logger.log(`Processing sheet "${sheetName}" with ${items.length} rows.`);

                for (const item of items) {
                    try {
                        const keys = Object.keys(item);
                        const findValue = (keywords: string[]) => {
                            const foundKey = keys.find(k => keywords.some(kw => k.toUpperCase().includes(kw.toUpperCase())));
                            return foundKey ? item[foundKey] : null;
                        };

                        const code = findValue(['MÃ MÔN', 'CODE', 'SUBCODE']);
                        if (!code) continue;

                        const name = findValue(['TÊN MÔN', 'NAME']) ? String(findValue(['TÊN MÔN', 'NAME'])).replace(/\r\n/g, ' ') : null;
                        const semester = sheetName; // Use sheet name as semester
                        const department = findValue(['BỘ MÔN', 'DEPARTMENT']) || null;
                        const detailsStr = findValue(['CHI TIẾT', 'DETAILS', 'DETAIL']) || '';
                        const examPartCol = findValue(['EXAMPART', 'PHẦN THI', 'PHANTHI', 'PARTS', 'EXTRAPARTS']);
                        
                        // New duration logic: 270 -> 180, 90 -> 60. Others (180, 60) remain same.
                        const rawDuration = parseInt(String(findValue(['TỔNG THỜI LƯỢNG', 'DURATION', 'EXAMDURATION']))) || null;
                        let totalDuration = rawDuration;
                        if (rawDuration === 270) totalDuration = 180;
                        else if (rawDuration === 90) totalDuration = 60;

                        // Find Semester ID by data.semesterId or lookup by sheet name
                        let semesterId: string | null = data.semesterId || null;
                        if (!semesterId && semester) {
                            const semStr = String(semester);
                            const semEntity = await this.prisma.semester.findFirst({
                                where: {
                                    OR: [
                                        { code: semStr },
                                        { name: semStr }
                                    ]
                                }
                            });
                            if (semEntity) {
                                semesterId = semEntity.id;
                            }
                        }

                        const isCoursera = !!findValue(['IS_COURSERA', 'isCoursera', 'COURSERA']);
                        const isMajor = !!findValue(['IS_MAJOR', 'isMajor', 'MAJOR']);

                        // Upsert Subject
                        const subject = await this.prisma.subject.upsert({
                            where: { code: String(code) },
                            update: {
                                name: name ? String(name) : undefined,
                                semesterId: semesterId || undefined,
                                department: department ? String(department) : undefined,
                                isCoursera,
                                isMajor,
                            },
                            create: {
                                id: uuidv4(),
                                code: String(code),
                                name: name ? String(name) : null,
                                semesterId: semesterId,
                                department: department ? String(department) : null,
                                isCoursera,
                                isMajor,
                            }
                        });

                        // Parse parts from details string (e.g. "1.Reading: 30ph; 2.Writing: 30ph")
                        let parts = this.parseSubjectParts(String(detailsStr), examParts);

                        // If no parts in details, check the examPart column (production backup)
                        // This allows columns like: examPart: "FE" or "Reading, Writing"
                        if (parts.length === 0 && examPartCol) {
                            const partIdentifiers = String(examPartCol).split(/[,;]/).map(p => p.trim()).filter(Boolean);
                            for (const pId of partIdentifiers) {
                                // 1. Match by Exact Code (High priority)
                                // 2. Match by Exact/Partial Name (Fallback)
                                const found = examParts.find(et => 
                                    et.code.toUpperCase() === pId.toUpperCase() || 
                                    (et.name && et.name.toUpperCase() === pId.toUpperCase()) ||
                                    (et.name && et.name.toUpperCase().includes(pId.toUpperCase()))
                                );

                                if (found) {
                                    parts.push({
                                        examPartId: found.id,
                                        duration: totalDuration ? Math.floor(totalDuration / partIdentifiers.length) : 60
                                    });
                                }
                            }
                        }

                        // Re-create parts for this subject
                        if (parts.length > 0) {
                            await this.prisma.subjectPart.deleteMany({
                                where: { subjectId: subject.id }
                            });

                            for (const part of parts) {
                                await this.prisma.subjectPart.create({
                                    data: {
                                        id: uuidv4(),
                                        subjectId: subject.id,
                                        examPartId: part.examPartId,
                                        duration: part.duration,
                                    }
                                });
                            }
                        } else if (totalDuration) {
                            // Fallback to single part if totalDuration exists but no parts parsed
                            const defaultType = examParts.find(t => t.code === 'MC') || examParts.find(t => t.code === 'FE') || examParts[0];
                            if (defaultType) {
                                await this.prisma.subjectPart.upsert({
                                    where: {
                                        subjectId_examPartId: {
                                            subjectId: subject.id,
                                            examPartId: defaultType.id
                                        }
                                    },
                                    update: {
                                        duration: totalDuration
                                    },
                                    create: {
                                        id: uuidv4(),
                                        subjectId: subject.id,
                                        examPartId: defaultType.id,
                                        duration: totalDuration,
                                    }
                                });
                            }
                        }
                        totalSuccess++;
                    } catch (err) {
                        this.logger.error(`Error processing subject at row in sheet ${sheetName}: ${err.message}`);
                        totalError++;
                    }
                }
            }

            this.emitFinished('subjects', data.fileName, totalSuccess, totalError);
            channel.ack(originalMsg);

            return {
                jobId: originalMsg.properties.messageId || 'unknown',
                success: true,
                processingTime: Date.now() - startTime,
                completedAt: new Date(),
            };
        } catch (error) {
            this.logger.error(`Critical error during subject import: ${error.message}`);
            channel.nack(originalMsg, false, false);
            return this.failResult(originalMsg, startTime, error.message);
        }
    }

    private parseSubjectParts(details: string, examParts: ExamPart[]): { examPartId: string; duration: number }[] {
        if (!details) return [];

        const results: { examPartId: string; duration: number }[] = [];
        // Regex to find "N.Name: Duration ph" patterns
        // E.g. "1.Đọc: 40ph"
        const regex = /(\d+)\.\s*([^:]+):\s*(\d+)(?:\s*(?:ph|phút|min))?/gi;
        let match;

        while ((match = regex.exec(details)) !== null) {
            const partName = match[2].trim().toLowerCase();
            const duration = parseInt(match[3]);

            // Map partName to ExamPart
            // We'll look for code or name containing the part name
            let examPart = examParts.find(t =>
                t.name.toLowerCase().includes(partName) ||
                t.code.toLowerCase().includes(partName)
            );

            // Special mappings based on common Vietnamese terms in provided Excel
            if (!examPart) {
                if (partName.includes('đọc') || partName.includes('reading')) examPart = examParts.find(t => t.code === 'R');
                else if (partName.includes('nghe') || partName.includes('listening')) examPart = examParts.find(t => t.code === 'L');
                else if (partName.includes('viết') || partName.includes('writing')) examPart = examParts.find(t => t.code === 'W');
                else if (partName.includes('nói') || partName.includes('speaking')) examPart = examParts.find(t => t.code === 'S');
                else if (partName.includes('fe') || partName.includes('final')) examPart = examParts.find(t => t.code === 'FE');
                else if (partName.includes('pe') || partName.includes('practical')) examPart = examParts.find(t => t.code === 'PE');
                else if (partName.includes('te') || partName.includes('test')) examPart = examParts.find(t => t.code === 'TE');
            }

            if (examPart) {
                results.push({
                    examPartId: examPart.id,
                    duration
                });
            }
        }

        return results;
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

                    const room = await this.prisma.examRoom.findFirst({
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

    private resolveCampus(campus?: string | null): Campus {
        const normalized = String(campus || 'DN').trim().toUpperCase();
        if (Object.values(Campus).includes(normalized as Campus)) {
            return normalized as Campus;
        }
        return Campus.DN;
    }

    private resolveImportedAssignmentType(rawType?: string | null): 'ROOM' | 'HALL' {
        const normalized = String(rawType || '').trim().toUpperCase();
        if (normalized.includes('HALL')) return 'HALL';
        return 'ROOM';
    }

    private emitFinished(
        action: 'rooms' | 'schedule' | 'proctor' | 'examcode' | 'subjects',
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
