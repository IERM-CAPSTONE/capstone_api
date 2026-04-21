import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { EXAM_PART_REPOSITORY } from './domain';
import { PrismaExamPartRepository } from './infrastructure';

@Module({
    imports: [PrismaModule],
    providers: [
        {
            provide: EXAM_PART_REPOSITORY,
            useClass: PrismaExamPartRepository,
        },
    ],
    exports: [EXAM_PART_REPOSITORY],
})
export class ExamPartsCoreModule { }
