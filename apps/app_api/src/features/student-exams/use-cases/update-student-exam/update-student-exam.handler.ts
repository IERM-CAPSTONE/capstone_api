import { Inject, Injectable } from '@nestjs/common';
import { IStudentExamRepository, STUDENT_EXAM_REPOSITORY } from '@app/student-exams';
import { PrismaService } from '@app/prisma';
import { StudentExamResponse, toStudentExamResponse } from '../../shared/student-exam.response';
import { UpdateStudentExamDto } from './update-student-exam.dto';
import { logSessionActivity } from '../../../../common/utils/activity-history.util';

@Injectable()
export class UpdateStudentExamHandler {
    constructor(
        @Inject(STUDENT_EXAM_REPOSITORY)
        private readonly studentExamRepository: IStudentExamRepository,
        private readonly prisma: PrismaService,
    ) { }

    async execute(id: string, dto: UpdateStudentExamDto): Promise<StudentExamResponse> {
        const studentExam = await this.studentExamRepository.findById(id);

        if (!studentExam) {
            throw new Error(`Student exam with id '${id}' not found`);
        }

        const updated = studentExam.update({
            seatNumber: dto.seatNumber,
            seatPosition: dto.seatPosition,
        });

        const saved = await this.studentExamRepository.save(updated);

        if (dto.seatPosition !== undefined && dto.seatPosition !== studentExam.seatPosition) {
            await logSessionActivity(this.prisma, {
                sessionId: saved.examSessionId,
                activityType: 'MOVED',
                payload: {
                    event: 'STUDENT_MOVED_TO_ANOTHER_ROOM',
                    title: 'Student Position Updated',
                    message: `Student ${saved.studentId} moved from seat ${studentExam.seatPosition ?? 'N/A'} to ${dto.seatPosition ?? 'N/A'}`,
                    meta: {
                        studentExamId: saved.id,
                        previousSeatPosition: studentExam.seatPosition,
                        newSeatPosition: dto.seatPosition,
                    },
                },
            });
        }

        return toStudentExamResponse(saved);
    }
}
