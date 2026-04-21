import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { STUDENT_EXAM_REPOSITORY } from './domain/repositories';
import { PrismaStudentExamRepository } from './infrastructure';

@Global()
@Module({
    imports: [PrismaModule],
    providers: [
        {
            provide: STUDENT_EXAM_REPOSITORY,
            useClass: PrismaStudentExamRepository,
        },
    ],
    exports: [STUDENT_EXAM_REPOSITORY],
})
export class StudentExamsCoreModule { }
