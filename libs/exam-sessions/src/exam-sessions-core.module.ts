import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { EXAM_SESSION_REPOSITORY } from './domain/repositories';
import { PrismaExamSessionRepository } from './infrastructure';
import { SchedulingService } from './domain/services';

@Global()
@Module({
    imports: [PrismaModule],
    providers: [
        {
            provide: EXAM_SESSION_REPOSITORY,
            useClass: PrismaExamSessionRepository,
        },
        SchedulingService,
    ],
    exports: [EXAM_SESSION_REPOSITORY, SchedulingService],
})
export class ExamSessionsCoreModule { }
