import { Inject, Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@app/prisma';
import { StudentExam, IStudentExamRepository, STUDENT_EXAM_REPOSITORY } from '@app/student-exams';
import { EXAM_ROOM_REPOSITORY, IExamRoomRepository, SeatAllocationService } from '@app/exam-rooms';
import { EXAM_SESSION_REPOSITORY, IExamSessionRepository } from '@app/exam-sessions';
import { AssignStudentsToSeatsDto } from './assign-students-to-seats.dto';
import { AssignStudentsToSeatsResponse } from './assign-students-to-seats.response';

/**
 * Assign Students to Seats Handler
 * - Pure random allocation per exam session
 * - Transaction-based to prevent race conditions
 * - Detects duplicate file uploads (queue-based flow)
 */
@Injectable()
export class AssignStudentsToSeatsHandler {
    private readonly logger = new Logger(AssignStudentsToSeatsHandler.name);
    private readonly seatAllocationService = new SeatAllocationService();

    constructor(
        private readonly prisma: PrismaService,
        @Inject(STUDENT_EXAM_REPOSITORY)
        private readonly studentExamRepository: IStudentExamRepository,
        @Inject(EXAM_ROOM_REPOSITORY)
        private readonly examRoomRepository: IExamRoomRepository,
        @Inject(EXAM_SESSION_REPOSITORY)
        private readonly examSessionRepository: IExamSessionRepository,
    ) { }

    async execute(dto: AssignStudentsToSeatsDto): Promise<AssignStudentsToSeatsResponse> {
        this.logger.log(
            `🎯 Starting seat assignment for exam session: ${dto.examSessionId}, students: ${dto.studentIds.length}`,
        );

        // Validate input
        if (dto.studentIds.length === 0) {
            throw new BadRequestException('Student IDs list cannot be empty');
        }

        // Remove duplicates from student IDs
        const uniqueStudentIds = Array.from(new Set(dto.studentIds));

        // Validate exam session exists and get associated room (select only needed fields to avoid missing columns on older DBs)
        const rawSession = await this.prisma.examSession.findUnique({
            where: { id: dto.examSessionId },
            select: {
                id: true,
                examRoom: {
                    select: {
                        id: true,
                        roomNumber: true,
                        max_rows: true,
                        max_columns: true,
                        total_seats: true,
                    },
                },
            },
        });

        if (!rawSession) {
            throw new NotFoundException(`ExamSession with id ${dto.examSessionId} not found`);
        }

        if (!rawSession.examRoom) {
            throw new BadRequestException(
                `ExamSession ${dto.examSessionId} has no associated exam room`,
            );
        }

        const room = rawSession.examRoom;

        // Validate room has seat configuration
        const seatConfig = await this.prisma.examRoom.findUnique({
            where: { id: room.id },
            select: { max_rows: true, max_columns: true, total_seats: true },
        });

        if (!seatConfig || !seatConfig.max_rows || !seatConfig.max_columns || !seatConfig.total_seats) {
            throw new BadRequestException(
                `ExamRoom ${room.id} is missing seat configuration (max_rows, max_columns, total_seats)`,
            );
        }

        // Get already-assigned students in this session to prevent double-booking
        // Fetch assigned seats (filter nulls in memory to avoid Prisma null filter issues on legacy DB)
        const existingAssignments = (await this.prisma.studentExam.findMany({
            where: {
                examSessionId: dto.examSessionId,
            },
            select: { seatNumber: true },
        })).filter((a) => a.seatNumber !== null && a.seatNumber !== undefined);

        // Map seat numbers to seat IDs (format: R{row}C{column})
        const occupiedSeatIds = existingAssignments
            .map((a) => a.seatNumber ? this.seatNumberToSeatId(parseInt(a.seatNumber, 10), seatConfig.max_columns) : null)
            .filter(Boolean);

        // Generate seat grid and allocate
        const { assignments, remainingSeats } = this.seatAllocationService.allocateStudents(
            uniqueStudentIds,
            {
                maxRows: seatConfig.max_rows,
                maxColumns: seatConfig.max_columns,
                totalSeats: seatConfig.total_seats,
            },
            {
                seed: dto.randomSeed,
                occupiedSeatIds,
            },
        );

        // Update StudentExam records in a transaction
        const result = await this.prisma.$transaction(
            async (tx) => {
                const updates: Array<{ id: string; seatNumber: number }> = [];

                for (const assignment of assignments) {
                    const seatNumber = this.seatIdToSeatNumber(assignment.seatId, seatConfig.max_columns);
                    const seatNumberStr = seatNumber.toString();
                    const studentExamRecord = await tx.studentExam.findFirst({
                        where: {
                            examSessionId: dto.examSessionId,
                            studentId: assignment.studentId,
                        },
                    });

                    if (studentExamRecord) {
                        // Update existing
                        await tx.studentExam.update({
                            where: { id: studentExamRecord.id },
                            data: {
                                seatNumber: seatNumberStr,
                                status: 'REGISTERED', // Ensure registered status
                                updatedAt: new Date(),
                            },
                        });
                        updates.push({ id: studentExamRecord.id, seatNumber });
                    } else {
                        // Create new StudentExam record with seat assignment
                        const newId = uuidv4();
                        await tx.studentExam.create({
                            data: {
                                id: newId,
                                examSessionId: dto.examSessionId,
                                studentId: assignment.studentId,
                                seatNumber: seatNumberStr,
                                status: 'REGISTERED',
                                isMatched: false,
                                isValid: true,
                                createdAt: new Date(),
                                updatedAt: new Date(),
                            },
                        });
                        updates.push({ id: newId, seatNumber });
                    }
                }

                return updates;
            },
            { isolationLevel: 'Serializable' },
        );

        // Fetch complete assigned data with student info for frontend seat map rendering
        const assignedStudentExams = (await this.prisma.studentExam.findMany({
            where: {
                examSessionId: dto.examSessionId,
            },
            include: {
                student: {
                    select: {
                        id: true,
                        fullName: true,
                        code: true,
                    },
                },
            },
        })).filter((se) => se.seatNumber !== null && se.seatNumber !== undefined);

        this.logger.log(
            `✅ Seat assignment completed: ${result.length} students assigned, ${remainingSeats.length} seats remaining`,
        );

        return {
            assignedCount: assignments.length,
            failedCount: uniqueStudentIds.length - assignments.length,
            availableSeatsCount: remainingSeats.length,
            assignments,
            examSessionId: dto.examSessionId,
            examRoomId: room.id,
            maxRows: seatConfig.max_rows,
            maxColumns: seatConfig.max_columns,
            totalSeats: seatConfig.total_seats,
            assignedAt: new Date(),
            // Add complete data for frontend seat map rendering
            studentExams: assignedStudentExams,
            examRoom: {
                id: room.id,
                roomNumber: room.roomNumber,
                max_rows: seatConfig.max_rows,
                max_columns: seatConfig.max_columns,
                total_seats: seatConfig.total_seats,
            },
        };
    }

    /**
     * Convert seat ID (R1C1) to 1-indexed seat number
     * Layout: left-to-right, top-to-bottom
     */
    private seatIdToSeatNumber(seatId: string, maxColumns: number): number {
        const match = seatId.match(/R(\d+)C(\d+)/);
        if (!match) throw new Error(`Invalid seat ID format: ${seatId}`);
        const row = parseInt(match[1], 10);
        const col = parseInt(match[2], 10);
        return (row - 1) * maxColumns + col;
    }

    /**
     * Convert seat number to seat ID (R1C1)
     * Layout: left-to-right, top-to-bottom
     */
    private seatNumberToSeatId(seatNumber: number, maxColumns: number): string | null {
        if (seatNumber < 1) return null;
        const row = Math.floor((seatNumber - 1) / maxColumns) + 1;
        const col = ((seatNumber - 1) % maxColumns) + 1;
        return `R${row}C${col}`;
    }
}
