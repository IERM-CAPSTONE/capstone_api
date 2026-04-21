import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IExamPartRepository, EXAM_PART_REPOSITORY } from '@app/exam-parts';
import { ExamPartResponse, toExamPartResponse } from '../../shared/exam-part.response';
import { UpdateExamPartDto } from './update-exam-part.dto';

@Injectable()
export class UpdateExamPartHandler {
    constructor(
        @Inject(EXAM_PART_REPOSITORY)
        private readonly examPartRepository: IExamPartRepository,
    ) { }

    async execute(id: string, dto: UpdateExamPartDto): Promise<ExamPartResponse> {
        const examPart = await this.examPartRepository.findById(id);
        if (!examPart) {
            throw new NotFoundException(`Exam type with ID '${id}' not found`);
        }

        const updated = examPart.update({
            name: dto.name,
            description: dto.description,
        });

        const saved = await this.examPartRepository.save(updated);
        return toExamPartResponse(saved);
    }
}
