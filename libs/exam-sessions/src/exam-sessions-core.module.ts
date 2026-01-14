import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { EXAM_SESSION_REPOSITORY } from './domain/repositories';
import { PrismaExamSessionRepository } from './infrastructure';

@Global()
@Module({
    imports: [PrismaModule],
    providers: [
        {
            provide: EXAM_SESSION_REPOSITORY,
            useClass: PrismaExamSessionRepository,
        },
    ],
    exports: [EXAM_SESSION_REPOSITORY],
})
export class ExamSessionsCoreModule { }
