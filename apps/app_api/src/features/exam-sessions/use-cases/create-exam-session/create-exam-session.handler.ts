import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ExamSession, IExamSessionRepository, EXAM_SESSION_REPOSITORY } from '@app/exam-sessions';
import { IExamSeatRepository } from '@app/exam-seats';
import { PrismaService } from '@app/prisma';
import { ExamSeat } from '@app/exam-seats';
import { ExamSessionResponse, toExamSessionResponse } from '../../shared/exam-session.response';
import { CreateExamSessionDto } from './create-exam-session.dto';

@Injectable()
export class CreateExamSessionHandler {
    constructor(
        @Inject(EXAM_SESSION_REPOSITORY)
        private readonly repository: IExamSessionRepository,
        @Inject('EXAM_SEAT_REPOSITORY')
        private readonly seatRepository: IExamSeatRepository,
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

        // 3. Create aggregate
        const session = ExamSession.create({
            id: uuidv4(),
            ...dto
        });

        const saved = await this.repository.save(session);

        // 4. Auto-initialize exam seats if room is assigned
        if (saved.examRoomId) {
            const room = await this.prisma.examRoom.findUnique({
                where: { id: saved.examRoomId }
            });

            if (room) {
                const maxRows = room.max_rows ?? 6;
                const maxColumns = room.max_columns ?? 3;
                const maxGridSeats = maxRows * maxColumns;
                const totalSeats = room.total_seats ?? maxGridSeats;
                const seatsToGenerate = Math.max(1, Math.min(totalSeats, maxGridSeats));
                const seatsToCreate: ExamSeat[] = [];

                let generated = 0;
                for (let row = 1; row <= maxRows && generated < seatsToGenerate; row++) {
                    for (let col = 1; col <= maxColumns && generated < seatsToGenerate; col++) {
                        seatsToCreate.push(
                            ExamSeat.create({
                                id: uuidv4(),
                                examSessionId: saved.id,
                                row,
                                col,
                                status: 'Available',
                            })
                        );
                        generated++;
                    }
                }

                if (seatsToCreate.length > 0) {
                    await this.seatRepository.saveMany(seatsToCreate);
                }
            }
        }

        return toExamSessionResponse(saved);
    }
}
