import { Inject, Injectable } from '@nestjs/common';
import { IStudentExamRepository, STUDENT_EXAM_REPOSITORY } from '@app/student-exams';
import { StudentExamResponse, toStudentExamResponse } from '../../shared/student-exam.response';
import { UpdateStudentExamDto } from './update-student-exam.dto';

@Injectable()
export class UpdateStudentExamHandler {
    constructor(
        @Inject(STUDENT_EXAM_REPOSITORY)
        private readonly studentExamRepository: IStudentExamRepository,
    ) { }

    async execute(id: string, dto: UpdateStudentExamDto): Promise<StudentExamResponse> {
        const studentExam = await this.studentExamRepository.findById(id);
        
        if (!studentExam) {
            throw new Error(`Student exam with id '${id}' not found`);
        }

        const updated = studentExam.update({
            seatNumber: dto.seatNumber,
            status: dto.status,
            currentLocation: dto.currentLocation,
            identityId: dto.identityId,
            isMatched: dto.isMatched,
            checkinTime: dto.checkinTime,
            checkoutTime: dto.checkoutTime,
            isValid: dto.isValid,
        });

        const saved = await this.studentExamRepository.save(updated);

        return toStudentExamResponse(saved);
    }
}
