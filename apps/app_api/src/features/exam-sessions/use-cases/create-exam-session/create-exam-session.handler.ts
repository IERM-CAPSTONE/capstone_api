import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ExamSession, IExamSessionRepository, EXAM_SESSION_REPOSITORY } from '@app/exam-sessions';
import { IExamSeatRepository } from '@app/exam-seats';
import { PrismaService } from '@app/prisma';
import { ExamSeat } from '@app/exam-seats';
import { STUDENT_EXAM_REPOSITORY, IStudentExamRepository, StudentExam } from '@app/student-exams';
import { ExamSessionResponse, toExamSessionResponse } from '../../shared/exam-session.response';
import { CreateExamSessionDto } from './create-exam-session.dto';

@Injectable()
export class CreateExamSessionHandler {
    constructor(
        @Inject(EXAM_SESSION_REPOSITORY)
        private readonly repository: IExamSessionRepository,
        @Inject('EXAM_SEAT_REPOSITORY')
        private readonly seatRepository: IExamSeatRepository,
        @Inject(STUDENT_EXAM_REPOSITORY)
        private readonly studentExamRepository: IStudentExamRepository,
        private readonly prisma: PrismaService,
    ) { }

    async execute(dto: CreateExamSessionDto): Promise<ExamSessionResponse> {
        // 1. Validation basics
        if (!dto.examOpenTime || !dto.examCloseTime) {
            throw new Error('Exam open time and close time are required');
        }

        const startTime = new Date(dto.examOpenTime);
        const endTime = new Date(dto.examCloseTime);

        if (startTime >= endTime) {
            throw new Error('Open time must be before close time');
        }

        // 2. Check for overlaps (Room or Staff)
        const overlaps = await this.repository.findOverlapping({
            startTime,
            endTime,
            examRoomId: dto.examRoomId,
            proctorId: dto.proctorId,
            hallInvigilatorId: dto.hallInvigilatorId,
        });

        if (overlaps.length > 0) {
            const conflict = overlaps[0];
            if (dto.examRoomId && conflict.examRoomId === dto.examRoomId) {
                throw new Error(`Room is already occupied by another session during this time.`);
            }
            throw new Error(`One or more staff members are already assigned to another session during this time.`);
        }

        // 4. Resolve ExamParts from Subject if not provided
        let resolvedExamParts = dto.examPart || [];
        if (resolvedExamParts.length === 0 && dto.subjectCode) {
            const subjectWithParts = await this.prisma.subject.findUnique({
                where: { code: dto.subjectCode },
                include: { parts: { include: { examPart: true } } }
            });

            if (subjectWithParts && subjectWithParts.parts.length > 0) {
                resolvedExamParts = subjectWithParts.parts.map(p => p.examPart.code);
            }
        }

        // 5. Fetch resolved ExamPart entities from DB to get their IDs
        const dbExamParts = await this.prisma.examPart.findMany({
            where: { code: { in: resolvedExamParts } }
        });

        const sessionId = uuidv4();
        const studentExamData: any[] = [];
        const studentExamPartData: any[] = [];
        const seatsToCreate: any[] = [];
        const seatUpdates: any[] = [];

        // 6. Plan exam seats if room is assigned
        if (dto.examRoomId) {
            const room = await this.prisma.examRoom.findUnique({
                where: { id: dto.examRoomId }
            });

            if (room && room.max_rows && room.max_columns) {
                for (let row = 1; row <= room.max_rows; row++) {
                    for (let col = 1; col <= room.max_columns; col++) {
                        seatsToCreate.push({
                            id: uuidv4(),
                            examSessionId: sessionId,
                            row,
                            col,
                            status: 'Available',
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        });
                    }
                }
            }
        }

        // 7. Plan student exams and assign seats with Spacing Principle (Checkerboard)
        if (dto.studentIds && dto.studentIds.length > 0) {
            // Shuffle students for randomness
            const shuffledStudentIds = [...dto.studentIds].sort(() => Math.random() - 0.5);

            // Prioritize seats using Checkerboard pattern (row + col is even)
            // This ensures no two students are directly adjacent if room capacity allows
            const prioritySeats = seatsToCreate
                .filter(s => (s.row + s.col) % 2 === 0)
                .sort(() => Math.random() - 0.5);

            const secondarySeats = seatsToCreate
                .filter(s => (s.row + s.col) % 2 !== 0)
                .sort(() => Math.random() - 0.5);

            const optimizedSeatOrder = [...prioritySeats, ...secondarySeats];

            for (let i = 0; i < shuffledStudentIds.length; i++) {
                const studentId = shuffledStudentIds[i];
                const studentExamId = uuidv4();

                // Assign seat from our optimized order
                let assignedSeatId: string | null = null;
                let seatNumber: string | null = null;

                if (i < optimizedSeatOrder.length) {
                    const seat = optimizedSeatOrder[i];
                    assignedSeatId = seat.id;
                    seatNumber = `${seat.row}-${seat.col}`;
                    seat.status = 'Assigned';
                }

                studentExamData.push({
                    id: studentExamId,
                    examSessionId: sessionId,
                    studentId: studentId,
                    seatPosition: assignedSeatId,
                    seatNumber: seatNumber,
                    stt: i + 1,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });

                // Plan StudentExamPart for each exam part
                if (dbExamParts.length > 0) {
                    for (const part of dbExamParts) {
                        studentExamPartData.push({
                            id: uuidv4(),
                            studentExamId: studentExamId,
                            examPartId: part.id,
                            isCheckedIn: false,
                            isInRoom: false,
                            isSubmit: false,
                            isSign: false,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        });
                    }
                }
            }
        }

        // 8. Execute everything in a transaction
        await this.prisma.$transaction(async (tx) => {
            // Create Session
            const session = ExamSession.create({
                id: sessionId,
                ...dto,
                examPart: resolvedExamParts
            });
            await this.repository.save(session);

            // Create Seats
            if (seatsToCreate.length > 0) {
                await tx.examSeat.createMany({ data: seatsToCreate });
            }

            // Create Student Exams
            if (studentExamData.length > 0) {
                await tx.studentExam.createMany({ data: studentExamData });
            }

            // Create Student Exam Parts
            if (studentExamPartData.length > 0) {
                await tx.studentExamPart.createMany({ data: studentExamPartData });
            }
        });

        const savedSession = await this.repository.findById(sessionId);
        if (!savedSession) throw new Error('Failed to retrieve created session');

        return toExamSessionResponse(savedSession);
    }
}
