import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IExamSessionRepository, EXAM_SESSION_REPOSITORY } from '@app/exam-sessions';

@Injectable()
export class DeleteExamSessionHandler {
    constructor(
        @Inject(EXAM_SESSION_REPOSITORY)
        private readonly repository: IExamSessionRepository,
    ) { }

    async execute(id: string): Promise<void> {
        const exists = await this.repository.exists(id);
        if (!exists) {
            throw new NotFoundException(`ExamSession with id ${id} not found`);
        }
        await this.repository.delete(id);
    }
}
