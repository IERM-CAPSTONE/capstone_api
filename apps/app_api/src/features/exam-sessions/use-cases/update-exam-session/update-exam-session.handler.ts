import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IExamSessionRepository, EXAM_SESSION_REPOSITORY } from '@app/exam-sessions';
import { ExamSessionResponse, toExamSessionResponse } from '../../shared/exam-session.response';
import { UpdateExamSessionDto } from './update-exam-session.dto';

@Injectable()
export class UpdateExamSessionHandler {
    constructor(
        @Inject(EXAM_SESSION_REPOSITORY)
        private readonly repository: IExamSessionRepository,
    ) { }

    async execute(id: string, dto: UpdateExamSessionDto): Promise<ExamSessionResponse> {
        const session = await this.repository.findById(id);
        if (!session) {
            throw new NotFoundException(`ExamSession with id ${id} not found`);
        }

        const updated = session.update(dto);

        // Conflict validation
        const overlaps = await this.repository.findOverlapping({
            startTime: updated.examTime.openTime!,
            endTime: updated.examTime.closeTime!,
            examRoomId: updated.examRoomId,
            proctorId: updated.proctorId,
            hallInvigilatorId: updated.hallInvigilatorId,
            excludeId: id,
        });

        if (overlaps.length > 0) {
            const conflict = overlaps[0];
            if (updated.examRoomId && conflict.examRoomId === updated.examRoomId) {
                throw new Error(`Room is already occupied by another session during this time.`);
            }
            const hasDisallowedStaffConflict = overlaps.some((item) => {
                if (updated.proctorId && item.proctorId === updated.proctorId) {
                    return true;
                }

                if (updated.hallInvigilatorId && item.hallInvigilatorId === updated.hallInvigilatorId) {
                    return !this.isSameTimeSlot(
                        item.examTime.openTime,
                        item.examTime.closeTime,
                        updated.examTime.openTime,
                        updated.examTime.closeTime,
                    );
                }

                return false;
            });

            if (hasDisallowedStaffConflict) {
                throw new Error(`One or more staff members are already assigned to another session during this time.`);
            }
        }

        const saved = await this.repository.save(updated);
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
