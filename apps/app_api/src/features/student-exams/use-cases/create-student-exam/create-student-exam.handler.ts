import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { StudentExam, IStudentExamRepository, STUDENT_EXAM_REPOSITORY } from '@app/student-exams';
import { StudentExamResponse, toStudentExamResponse } from '../../shared/student-exam.response';
import { CreateStudentExamDto } from './create-student-exam.dto';

@Injectable()
export class CreateStudentExamHandler {
    constructor(
        @Inject(STUDENT_EXAM_REPOSITORY)
        private readonly studentExamRepository: IStudentExamRepository,
    ) { }

    async execute(dto: CreateStudentExamDto): Promise<StudentExamResponse> {
        // Check if student is already registered for this session
        if (await this.studentExamRepository.exists({ examSessionId: dto.examSessionId, studentId: dto.studentId })) {
            throw new Error(`Student is already registered for this exam session`);
        }

        // Create aggregate
        const studentExam = StudentExam.create({
            id: uuidv4(),
            examSessionId: dto.examSessionId,
            studentId: dto.studentId,
            seatNumber: dto.seatNumber,
            seatPosition: dto.seatPosition,
            status: dto.status,
            currentLocation: dto.currentLocation,
            identityId: dto.identityId,
            isMatched: dto.isMatched,
            checkinTime: dto.checkinTime,
            checkoutTime: dto.checkoutTime,
            isValid: dto.isValid,
        });

        // Persist
        const saved = await this.studentExamRepository.save(studentExam);

        return toStudentExamResponse(saved);
    }
}
