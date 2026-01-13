import { Controller, Logger, Inject } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext, ClientProxy } from '@nestjs/microservices';
import { MESSAGE_PATTERNS, ExamImportJobData, BaseJobResult, RABBITMQ_CLIENTS, ExamImportFinishedData } from '@app/queue';
import { IExamRoomRepository, EXAM_ROOM_REPOSITORY, ExamRoom } from '@app/exam-rooms';
import { IExamSessionRepository, EXAM_SESSION_REPOSITORY, ExamSession } from '@app/exam-sessions';
import { IUserRepository, USER_REPOSITORY } from '@app/users';
import { CACHE_SERVICE, ICacheService } from '@app/cache';
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
                    const exists = await this.examRoomRepository.exists({ roomNumber: Number(RoomNumber) });
                    if (exists) {
                        this.logger.debug(`Room ${RoomNumber} already exists, updating...`);
                        // In DDD, we usually find and update.
                        const rooms = await this.examRoomRepository.findMany({ roomNumber: Number(RoomNumber) });
                        const existing = rooms[0];
                        const updated = existing.update({ capacity: Capacity ? Number(Capacity) : undefined });
                        await this.examRoomRepository.save(updated);
                    } else {
                        const room = ExamRoom.create({
                            id: uuidv4(),
                            roomNumber: Number(RoomNumber),
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

    @MessagePattern(MESSAGE_PATTERNS.EXAM.IMPORT_SESSION)
    async handleImportSessions(
        @Payload() data: ExamImportJobData,
        @Ctx() context: RmqContext,
    ): Promise<BaseJobResult> {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        const startTime = Date.now();

        this.logger.log(`Processing exam session import from file: ${data.fileName}`);

        try {
            const buffer = Buffer.from(data.fileContent, 'base64');
            const workbook = xlsx.read(buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const items: any[] = xlsx.utils.sheet_to_json(worksheet);

            this.logger.log(`Found ${items.length} rows for sessions import.`);

            let successCount = 0;
            let errorCount = 0;

            for (const item of items) {
                try {
                    // RoomNumber, ProctorEmail, HallInvigilatorEmail, SemesterCode, OpenTime, CloseTime
                    const { RoomNumber, ProctorEmail, HallInvigilatorEmail, SemesterCode, OpenTime, CloseTime } = item;

                    let roomId: string | null = null;
                    if (RoomNumber) {
                        const rooms = await this.examRoomRepository.findMany({ roomNumber: Number(RoomNumber) });
                        if (rooms.length > 0) {
                            roomId = rooms[0].id;
                        } else {
                            this.logger.warn(`Room ${RoomNumber} not found, skipping or setting to null`);
                        }
                    }

                    let proctorId: string | null = null;
                    if (ProctorEmail) {
                        const user = await this.userRepository.findOne({ email: ProctorEmail });
                        if (user) proctorId = user.id;
                    }

                    let invigilatorId: string | null = null;
                    if (HallInvigilatorEmail) {
                        const user = await this.userRepository.findOne({ email: HallInvigilatorEmail });
                        if (user) invigilatorId = user.id;
                    }

                    const session = ExamSession.create({
                        id: uuidv4(),
                        examRoomId: roomId,
                        proctorId: proctorId,
                        hallInvigilatorId: invigilatorId,
                        semesterCode: SemesterCode?.toString(),
                        examOpenTime: OpenTime ? new Date(OpenTime) : null,
                        examCloseTime: CloseTime ? new Date(CloseTime) : null,
                    });

                    // Check for overlaps before saving
                    if (session.examTime.openTime && session.examTime.closeTime) {
                        const overlaps = await this.examSessionRepository.findOverlapping({
                            startTime: session.examTime.openTime,
                            endTime: session.examTime.closeTime,
                            examRoomId: session.examRoomId,
                            proctorId: session.proctorId,
                            hallInvigilatorId: session.hallInvigilatorId,
                        });

                        if (overlaps.length > 0) {
                            throw new Error(`Session overlaps with an existing session.`);
                        }
                    }

                    await this.examSessionRepository.save(session);
                    successCount++;
                } catch (err) {
                    this.logger.error(`Error processing session row: ${err.message}`);
                    errorCount++;
                }
            }

            this.emitFinished('sessions', data.fileName, successCount, errorCount);
            channel.ack(originalMsg);

            return {
                jobId: originalMsg.properties.messageId || 'unknown',
                success: true,
                processingTime: Date.now() - startTime,
                completedAt: new Date(),
            };
        } catch (error) {
            this.logger.error(`Critical error during session import: ${error.message}`);
            channel.nack(originalMsg, false, false);
            return this.failResult(originalMsg, startTime, error.message);
        }
    }

    private emitFinished(action: 'rooms' | 'sessions', fileName: string, successCount: number, errorCount: number) {
        const finishedData: ExamImportFinishedData = {
            action,
            fileName,
            successCount,
            errorCount,
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
