import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { EXAM_TYPE_REPOSITORY } from './domain';
import { PrismaExamTypeRepository } from './infrastructure';

@Module({
    imports: [PrismaModule],
    providers: [
        {
            provide: EXAM_TYPE_REPOSITORY,
            useClass: PrismaExamTypeRepository,
        },
    ],
    exports: [EXAM_TYPE_REPOSITORY],
})
export class ExamTypesCoreModule { }
