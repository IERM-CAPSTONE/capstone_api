import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IExamSessionRepository, EXAM_SESSION_REPOSITORY } from '@app/exam-sessions';
import { ExamSessionResponse, toExamSessionResponse } from '../../shared/exam-session.response';

@Injectable()
export class GetExamSessionHandler {
    constructor(
        @Inject(EXAM_SESSION_REPOSITORY)
        private readonly repository: IExamSessionRepository,
    ) { }

    async execute(id: string): Promise<ExamSessionResponse> {
        const session = await this.repository.findById(id);
        if (!session) {
            throw new NotFoundException(`ExamSession with id ${id} not found`);
        }
        return toExamSessionResponse(session);
    }
}
