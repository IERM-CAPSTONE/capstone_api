import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ExamSession, IExamSessionRepository, EXAM_SESSION_REPOSITORY } from '@app/exam-sessions';
import { ExamSessionResponse, toExamSessionResponse } from '../../shared/exam-session.response';
import { CreateExamSessionDto } from './create-exam-session.dto';

@Injectable()
export class CreateExamSessionHandler {
    constructor(
        @Inject(EXAM_SESSION_REPOSITORY)
        private readonly repository: IExamSessionRepository,
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
        return toExamSessionResponse(saved);
    }
}
