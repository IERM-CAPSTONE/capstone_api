import { Inject, Injectable } from '@nestjs/common';
import { IExamTypeRepository, EXAM_TYPE_REPOSITORY } from '@app/exam-types';
import { ExamTypeResponse, toExamTypeResponse } from '../../shared/exam-type.response';

@Injectable()
export class ListExamTypesHandler {
    constructor(
        @Inject(EXAM_TYPE_REPOSITORY)
        private readonly examTypeRepository: IExamTypeRepository,
    ) { }

    async execute(): Promise<ExamTypeResponse[]> {
        const examTypes = await this.examTypeRepository.findAll();
        return examTypes.map(toExamTypeResponse);
    }
}
