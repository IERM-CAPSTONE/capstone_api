import { Module } from '@nestjs/common';
import { StudentExamsCoreModule } from '@app/student-exams';
import { ExamRoomsCoreModule } from '@app/exam-rooms';
import { ExamSessionsCoreModule } from '@app/exam-sessions';
import { PrismaModule } from '@app/prisma';

// Use Cases
import { CreateStudentExamHandler, CreateStudentExamEndpoint } from './use-cases/create-student-exam';
import { ListStudentExamsHandler, ListStudentExamsEndpoint } from './use-cases/list-student-exams';
import { GetStudentExamHandler, GetStudentExamEndpoint } from './use-cases/get-student-exam';
import { UpdateStudentExamHandler, UpdateStudentExamEndpoint } from './use-cases/update-student-exam';
import { DeleteStudentExamHandler, DeleteStudentExamEndpoint } from './use-cases/delete-student-exam';
import { UpdateStudentExamPartHandler, UpdateStudentExamPartEndpoint } from './use-cases/update-student-exam-part';

@Module({
    imports: [StudentExamsCoreModule, ExamRoomsCoreModule, ExamSessionsCoreModule, PrismaModule],
    controllers: [
        CreateStudentExamEndpoint,
        ListStudentExamsEndpoint,
        GetStudentExamEndpoint,
        UpdateStudentExamEndpoint,
        DeleteStudentExamEndpoint,
        UpdateStudentExamPartEndpoint,
    ],
    providers: [
        CreateStudentExamHandler,
        ListStudentExamsHandler,
        GetStudentExamHandler,
        UpdateStudentExamHandler,
        DeleteStudentExamHandler,
        UpdateStudentExamPartHandler,
    ],
})
export class StudentExamsModule { }
