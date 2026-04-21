import { Inject, Injectable } from '@nestjs/common';
import { IStudentExamRepository, STUDENT_EXAM_REPOSITORY } from '@app/student-exams';

@Injectable()
export class DeleteStudentExamHandler {
    constructor(
        @Inject(STUDENT_EXAM_REPOSITORY)
        private readonly studentExamRepository: IStudentExamRepository,
    ) { }

    async execute(id: string): Promise<void> {
        const studentExam = await this.studentExamRepository.findById(id);
        
        if (!studentExam) {
            throw new Error(`Student exam with id '${id}' not found`);
        }

        await this.studentExamRepository.delete(id);
    }
}
