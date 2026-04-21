import { Inject, Injectable } from '@nestjs/common';
import { IStudentExamRepository, STUDENT_EXAM_REPOSITORY } from '@app/student-exams';
import { StudentExamResponse, toStudentExamResponse } from '../../shared/student-exam.response';

@Injectable()
export class GetStudentExamHandler {
    constructor(
        @Inject(STUDENT_EXAM_REPOSITORY)
        private readonly studentExamRepository: IStudentExamRepository,
    ) { }

    async execute(id: string): Promise<StudentExamResponse> {
        const studentExam = await this.studentExamRepository.findById(id);
        
        if (!studentExam) {
            throw new Error(`Student exam with id '${id}' not found`);
        }

        return toStudentExamResponse(studentExam);
    }
}
