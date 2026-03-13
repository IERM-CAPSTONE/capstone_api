import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ExamPart, IExamPartRepository, EXAM_PART_REPOSITORY } from '@app/exam-parts';
import { ExamPartResponse, toExamPartResponse } from '../../shared/exam-part.response';
import { CreateExamPartDto } from './create-exam-part.dto';

@Injectable()
export class CreateExamPartHandler {
    constructor(
        @Inject(EXAM_PART_REPOSITORY)
        private readonly examPartRepository: IExamPartRepository,
    ) { }

    async execute(dto: CreateExamPartDto): Promise<ExamPartResponse> {
        if (await this.examPartRepository.exists({ code: dto.code })) {
            throw new Error(`Exam type with code '${dto.code}' already exists`);
        }

        const examPart = ExamPart.create({
            id: uuidv4(),
            code: dto.code,
            name: dto.name,
            description: dto.description,
        });

        const saved = await this.examPartRepository.save(examPart);
        return toExamPartResponse(saved);
    }
}
