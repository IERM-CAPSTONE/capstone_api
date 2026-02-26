import { Inject, Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ExamSeat, IExamSeatRepository } from '@app/exam-seats';
import { IExamSessionRepository, EXAM_SESSION_REPOSITORY } from '@app/exam-sessions';
import { ExamSeatResponse, toExamSeatResponse } from '../../shared/exam-seat.response';
import { ChangeExamSeatStatusDto } from './change-seat-status.dto';

@Injectable()
export class ChangeExamSeatStatusHandler {
    constructor(
        @Inject('EXAM_SEAT_REPOSITORY')
        private readonly examSeatRepository: IExamSeatRepository,
        @Inject(EXAM_SESSION_REPOSITORY)
        private readonly examSessionRepository: IExamSessionRepository,
    ) { }

    async execute(dto: ChangeExamSeatStatusDto, userRole: string): Promise<ExamSeatResponse> {
        // Find the seat
        const examSeat = await this.examSeatRepository.findById(dto.id);
        if (!examSeat) {
            throw new BadRequestException(`Exam seat with id ${dto.id} not found`);
        }

        // Find the session
        const examSession = await this.examSessionRepository.findById(examSeat.examSessionId);
        if (!examSession) {
            throw new BadRequestException(`Exam session not found`);
        }

        // Gate: Cannot edit layout after students imported
        if (examSession.hasStudentsImported && !['Assigned', 'Present', 'Absent'].includes(dto.status)) {
            throw new ForbiddenException(
                'Cannot edit layout after students imported. Only status changes for existing student assignments are allowed.'
            );
        }

        // Validate status transition based on role
        this.validateStatusTransition(examSeat.status, dto.status, userRole);

        // Update the seat
        const updatedSeat = examSeat.updateStatus(dto.status as any);
        const saved = await this.examSeatRepository.save(updatedSeat);

        return toExamSeatResponse(saved);
    }

    private validateStatusTransition(
        currentStatus: string,
        newStatus: string,
        userRole: string
    ): void {
        // For Exam Officer (pre-exam layout editing)
        if (userRole === 'EXAM_OFFICER') {
            // Can only toggle between Available and Locked
            const validTransitions = {
                Available: ['Locked'],
                Locked: ['Available'],
                Assigned: [], // Cannot change seats with students assigned
                Present: [],  // Cannot change seats with checked-in students
                Absent: [],   // Cannot change seats with absent students
            };

            if (!validTransitions[currentStatus]?.includes(newStatus)) {
                throw new ForbiddenException(
                    `Cannot change seat status from ${currentStatus} to ${newStatus}. ` +
                    `Exam Officers can only toggle Available ↔ Locked for unassigned seats.`
                );
            }
        }

        // For Proctor (during exam operations)
        if (userRole === 'PROCTOR') {
            const validTransitions = {
                Available: [], // Proctors don't assign available seats
                Locked: [],    // Cannot move locked seats
                Assigned: ['Present'],     // Can mark as checked-in
                Present: ['Absent'],       // Can mark as absent
                Absent: [],                // Cannot change absent status
            };

            if (!validTransitions[currentStatus]?.includes(newStatus)) {
                throw new ForbiddenException(
                    `Cannot change seat status from ${currentStatus} to ${newStatus}. ` +
                    `Proctors can only: Assigned → Present (check-in), Present → Absent (no-show).`
                );
            }
        }

        // For Admin or other roles, allow all transitions (if needed)
    }
}
