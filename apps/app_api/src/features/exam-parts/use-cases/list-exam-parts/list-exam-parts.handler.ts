import { Inject, Injectable } from '@nestjs/common';
import { IExamPartRepository, EXAM_PART_REPOSITORY } from '@app/exam-parts';
import { ExamPartResponse, toExamPartResponse } from '../../shared/exam-part.response';

@Injectable()
export class ListExamPartsHandler {
    constructor(
        @Inject(EXAM_PART_REPOSITORY)
        private readonly examPartRepository: IExamPartRepository,
    ) { }

    async execute(): Promise<ExamPartResponse[]> {
        const examParts = await this.examPartRepository.findAll();
        return examParts.map(toExamPartResponse);
    }
}
