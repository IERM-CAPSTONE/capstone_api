import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ExamType, IExamTypeRepository, EXAM_TYPE_REPOSITORY } from '@app/exam-types';
import { ExamTypeResponse, toExamTypeResponse } from '../../shared/exam-type.response';
import { CreateExamTypeDto } from './create-exam-type.dto';

@Injectable()
export class CreateExamTypeHandler {
    constructor(
        @Inject(EXAM_TYPE_REPOSITORY)
        private readonly examTypeRepository: IExamTypeRepository,
    ) { }

    async execute(dto: CreateExamTypeDto): Promise<ExamTypeResponse> {
        if (await this.examTypeRepository.exists({ code: dto.code })) {
            throw new Error(`Exam type with code '${dto.code}' already exists`);
        }

        const examType = ExamType.create({
            id: uuidv4(),
            code: dto.code,
            name: dto.name,
            description: dto.description,
        });

        const saved = await this.examTypeRepository.save(examType);
        return toExamTypeResponse(saved);
    }
}
