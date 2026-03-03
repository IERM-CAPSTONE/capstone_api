import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IExamTypeRepository, EXAM_TYPE_REPOSITORY } from '@app/exam-types';

@Injectable()
export class DeleteExamTypeHandler {
    constructor(
        @Inject(EXAM_TYPE_REPOSITORY)
        private readonly examTypeRepository: IExamTypeRepository,
    ) { }

    async execute(id: string): Promise<void> {
        const exists = await this.examTypeRepository.exists({ id });
        if (!exists) {
            throw new NotFoundException(`Exam type with ID '${id}' not found`);
        }

        await this.examTypeRepository.delete(id);
    }
}
