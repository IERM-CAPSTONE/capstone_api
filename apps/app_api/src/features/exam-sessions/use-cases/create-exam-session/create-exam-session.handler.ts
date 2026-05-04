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
            const hasDisallowedStaffConflict = overlaps.some((item) => {
                if (dto.proctorId && item.proctorId === dto.proctorId) {
                    return true;
                }

                if (dto.hallInvigilatorId && item.hallInvigilatorId === dto.hallInvigilatorId) {
                    return !this.isSameTimeSlot(item.examTime.openTime, item.examTime.closeTime, startTime, endTime);
                }

                return false;
            });

            if (hasDisallowedStaffConflict) {
                throw new Error(`One or more staff members are already assigned to another session during this time.`);
            }
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

            if (room && room.max_rows && room.max_columns) {
                const seatsToCreate: ExamSeat[] = [];
                
                for (let row = 1; row <= room.max_rows; row++) {
                    for (let col = 1; col <= room.max_columns; col++) {
                        seatsToCreate.push(
                            ExamSeat.create({
                                id: uuidv4(),
                                examSessionId: saved.id,
                                row,
                                col,
                                status: 'Available',
                            })
                        );
                    }
                }

                if (seatsToCreate.length > 0) {
                    await this.seatRepository.saveMany(seatsToCreate);
                }
            }
        }

        return toExamSessionResponse(saved);
    }

    private isSameTimeSlot(
        leftOpen: Date | null,
        leftClose: Date | null,
        rightOpen: Date | null,
        rightClose: Date | null,
    ): boolean {
        if (!leftOpen || !leftClose || !rightOpen || !rightClose) {
            return false;
        }

        return leftOpen.getTime() === rightOpen.getTime()
            && leftClose.getTime() === rightClose.getTime();
    }
}
