import { Module } from '@nestjs/common';
import { ExamSeatsModule } from '@app/exam-seats';
import { ExamSessionsCoreModule } from '@app/exam-sessions';
import { PrismaModule } from '@app/prisma';
import { ExamSeatsController } from './exam-seats.controller';
import { ChangeExamSeatStatusHandler } from './use-cases/change-seat-status/change-seat-status.handler';
import { GetAllExamSeatsHandler } from './use-cases/get-all-exam-seats/get-all-exam-seats.handler';
import { GetExamSeatsBySessionHandler } from './use-cases/get-exam-seats-by-session/get-exam-seats-by-session.handler';
import { SwapSeatsHandler, SwapSeatsEndpoint } from './use-cases/swap-seats';

@Module({
    imports: [ExamSeatsModule, ExamSessionsCoreModule, PrismaModule],
    controllers: [ExamSeatsController, SwapSeatsEndpoint],
    providers: [
        ChangeExamSeatStatusHandler,
        GetAllExamSeatsHandler,
        GetExamSeatsBySessionHandler,
        SwapSeatsHandler,
    ],
    exports: [
        ChangeExamSeatStatusHandler,
        GetAllExamSeatsHandler,
        GetExamSeatsBySessionHandler,
        SwapSeatsHandler,
    ],
})
export class AppExamSeatsModule { }
