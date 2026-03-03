import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IExamTypeRepository, EXAM_TYPE_REPOSITORY } from '@app/exam-types';
import { ExamTypeResponse, toExamTypeResponse } from '../../shared/exam-type.response';
import { UpdateExamTypeDto } from './update-exam-type.dto';

@Injectable()
export class UpdateExamTypeHandler {
    constructor(
        @Inject(EXAM_TYPE_REPOSITORY)
        private readonly examTypeRepository: IExamTypeRepository,
    ) { }

    async execute(id: string, dto: UpdateExamTypeDto): Promise<ExamTypeResponse> {
        const examType = await this.examTypeRepository.findById(id);
        if (!examType) {
            throw new NotFoundException(`Exam type with ID '${id}' not found`);
        }

        const updated = examType.update({
            name: dto.name,
            description: dto.description,
        });

        const saved = await this.examTypeRepository.save(updated);
        return toExamTypeResponse(saved);
    }
}
