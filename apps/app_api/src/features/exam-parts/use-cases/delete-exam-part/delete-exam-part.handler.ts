import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IExamPartRepository, EXAM_PART_REPOSITORY } from '@app/exam-parts';

@Injectable()
export class DeleteExamPartHandler {
    constructor(
        @Inject(EXAM_PART_REPOSITORY)
        private readonly examPartRepository: IExamPartRepository,
    ) { }

    async execute(id: string): Promise<void> {
        const exists = await this.examPartRepository.exists({ id });
        if (!exists) {
            throw new NotFoundException(`Exam type with ID '${id}' not found`);
        }

        await this.examPartRepository.delete(id);
    }
}
