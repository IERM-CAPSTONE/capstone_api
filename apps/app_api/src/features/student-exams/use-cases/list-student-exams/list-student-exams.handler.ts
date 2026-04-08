import { Inject, Injectable } from '@nestjs/common';
import { IStudentExamRepository, STUDENT_EXAM_REPOSITORY } from '@app/student-exams';
import { PaginatedStudentExamResponse, toStudentExamResponse } from '../../shared/student-exam.response';
import { ListStudentExamsDto } from './list-student-exams.dto';

@Injectable()
export class ListStudentExamsHandler {
    constructor(
        @Inject(STUDENT_EXAM_REPOSITORY)
        private readonly studentExamRepository: IStudentExamRepository,
    ) { }

    async execute(dto: ListStudentExamsDto): Promise<PaginatedStudentExamResponse> {
        const { data, total } = await this.studentExamRepository.findMany({
            examSessionId: dto.examSessionId,
            studentId: dto.studentId,
            studentCode: dto.studentCode,
            status: dto.status,
            page: dto.page,
            limit: dto.limit,
        });

        return {
            data: data.map(toStudentExamResponse),
            total,
            page: dto.page || 1,
            limit: dto.limit || 10,
            totalPages: Math.ceil(total / (dto.limit || 10)),
        };
    }
}
