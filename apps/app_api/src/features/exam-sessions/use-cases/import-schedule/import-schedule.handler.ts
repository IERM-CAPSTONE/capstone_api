import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBITMQ_CLIENTS, MESSAGE_PATTERNS, ImportScheduleJobData } from '@app/queue';
import { PrismaService } from '@app/prisma';
import { ImportScheduleDto, ImportValidationMode } from './import-schedule.dto';

interface CapacityCheckSessionResult {
    examSession: string;
    room: string;
    students: number;
    totalSeats: number | null;
    canImport: boolean;
    reason?: string;
}

interface CapacityCheckResult {
    canImport: boolean;
    errors: string[];
    warnings: string[];
    sessions: CapacityCheckSessionResult[];
    summary: {
        totalSessions: number;
        totalStudents: number;
        totalSeats: number;
        overloadedSessions: number;
    };
}

@Injectable()
export class ImportScheduleHandler {
    private readonly logger = new Logger(ImportScheduleHandler.name);

    constructor(
        @Inject(RABBITMQ_CLIENTS.EXAM_SERVICE)
        private readonly examServiceClient: ClientProxy,
        private readonly prisma: PrismaService,
    ) { }

    async handle(dto: ImportScheduleDto) {
        if (dto.validationMode === ImportValidationMode.PREVIEW) {
            const capacityCheck = await this.validateCapacity(dto);

            return {
                success: true,
                message: capacityCheck.canImport
                    ? 'Capacity check passed. Ready to import.'
                    : 'Capacity check failed. Please review errors before import.',
                data: {
                    schedulesReceived: dto.schedules.length,
                    studentsReceived: dto.students.length,
                    capacityCheck,
                },
            };
        }

        // Guard import on the first chunk where schedules are sent.
        if (dto.schedules.length > 0) {
            const capacityCheck = await this.validateCapacity(dto);
            if (!capacityCheck.canImport) {
                throw new BadRequestException({
                    message: 'Import blocked due to capacity validation errors.',
                    capacityCheck,
                });
            }
        }

        this.logger.log(`Publishing import schedule job to queue. Schedules: ${dto.schedules.length}, Students: ${dto.students.length}`);

        const jobData: ImportScheduleJobData = {
            importType: dto.importType,
            schedules: dto.schedules,
            students: dto.students,
            batchId: dto.batchId,
            totalItems: dto.totalItems,
        };

        this.examServiceClient.emit(MESSAGE_PATTERNS.EXAM.IMPORT_SCHEDULE, jobData);

        return {
            success: true,
            message: 'Import schedule job has been queued for processing',
            data: {
                schedulesReceived: dto.schedules.length,
                studentsReceived: dto.students.length,
            }
        };
    }

    private async validateCapacity(dto: ImportScheduleDto): Promise<CapacityCheckResult> {
        const errors: string[] = [];
        const warnings: string[] = [];
        const sessionToRoom = new Map<string, string>();
        const studentCountBySession = new Map<string, number>();

        for (const schedule of dto.schedules) {
            const examSession = this.normalizeValue(schedule.examSession);
            const room = this.normalizeValue(schedule.room);

            if (!examSession) continue;
            if (room) {
                sessionToRoom.set(examSession, room);
            }
        }

        for (const student of dto.students) {
            const examSession = this.normalizeValue(student.examSession);
            if (!examSession) continue;

            studentCountBySession.set(examSession, (studentCountBySession.get(examSession) ?? 0) + 1);
        }

        const allSessions = Array.from(new Set([
            ...sessionToRoom.keys(),
            ...studentCountBySession.keys(),
        ])).sort((a, b) => a.localeCompare(b));

        const roomNumbers = Array.from(new Set(
            allSessions
                .map(session => sessionToRoom.get(session) ?? this.deriveRoomFromExamSession(session))
                .filter((room): room is string => Boolean(room)),
        ));

        const examRooms = roomNumbers.length > 0
            ? await this.prisma.examRoom.findMany({
                where: { roomNumber: { in: roomNumbers } },
                select: {
                    roomNumber: true,
                    total_seats: true,
                },
            })
            : [];

        const roomMap = new Map<string, { roomNumber: string; totalSeats: number | null }>(
            examRooms.map((room) => [
                room.roomNumber.trim().toLowerCase(),
                {
                    roomNumber: room.roomNumber,
                    totalSeats: room.total_seats ?? null,
                },
            ]),
        );

        const sessionResults: CapacityCheckSessionResult[] = [];
        let totalStudents = 0;
        let totalSeats = 0;
        let overloadedSessions = 0;

        for (const examSession of allSessions) {
            const room = sessionToRoom.get(examSession) ?? this.deriveRoomFromExamSession(examSession) ?? '';
            const students = studentCountBySession.get(examSession) ?? 0;
            totalStudents += students;

            if (!room) {
                const reason = `Cannot determine room for exam session "${examSession}".`;
                errors.push(reason);
                sessionResults.push({
                    examSession,
                    room: '',
                    students,
                    totalSeats: null,
                    canImport: false,
                    reason,
                });
                continue;
            }

            let roomData = roomMap.get(room.toLowerCase());
            if (!roomData) {
                const fallbackRoom = await this.prisma.examRoom.findFirst({
                    where: {
                        roomNumber: {
                            equals: room,
                            mode: 'insensitive',
                        },
                    },
                    select: {
                        roomNumber: true,
                        total_seats: true,
                    },
                });

                if (fallbackRoom) {
                    roomData = {
                        roomNumber: fallbackRoom.roomNumber,
                        totalSeats: fallbackRoom.total_seats ?? null,
                    };
                    roomMap.set(room.toLowerCase(), roomData);
                }
            }

            if (!roomData) {
                const reason = `Room "${room}" was not found in system for exam session "${examSession}".`;
                errors.push(reason);
                sessionResults.push({
                    examSession,
                    room,
                    students,
                    totalSeats: null,
                    canImport: false,
                    reason,
                });
                continue;
            }

            const totalSeatsForRoom = roomData.totalSeats;
            if (totalSeatsForRoom === null) {
                const reason = `Room "${roomData.roomNumber}" has no totalSeats value.`;
                errors.push(reason);
                sessionResults.push({
                    examSession,
                    room: roomData.roomNumber,
                    students,
                    totalSeats: null,
                    canImport: false,
                    reason,
                });
                continue;
            }

            totalSeats += totalSeatsForRoom;
            if (students > totalSeatsForRoom) {
                overloadedSessions += 1;
                const reason = `Session "${examSession}" has ${students} students but room "${roomData.roomNumber}" only has ${totalSeatsForRoom} totalSeats.`;
                errors.push(reason);
                sessionResults.push({
                    examSession,
                    room: roomData.roomNumber,
                    students,
                    totalSeats: totalSeatsForRoom,
                    canImport: false,
                    reason,
                });
                continue;
            }

            if (students === 0) {
                warnings.push(`Session "${examSession}" has 0 students in the uploaded file.`);
            }

            sessionResults.push({
                examSession,
                room: roomData.roomNumber,
                students,
                totalSeats: totalSeatsForRoom,
                canImport: true,
            });
        }

        if (allSessions.length === 0) {
            warnings.push('No exam sessions found in uploaded preview data.');
        }

        return {
            canImport: errors.length === 0,
            errors,
            warnings,
            sessions: sessionResults,
            summary: {
                totalSessions: allSessions.length,
                totalStudents,
                totalSeats,
                overloadedSessions,
            },
        };
    }

    private normalizeValue(value?: string | null): string {
        return (value ?? '').trim();
    }

    private deriveRoomFromExamSession(examSession: string): string | null {
        const normalized = examSession.trim();
        if (!normalized) return null;

        const parts = normalized.split(/\s+/);
        if (parts.length === 0) return null;

        return parts[parts.length - 1];
    }
}
