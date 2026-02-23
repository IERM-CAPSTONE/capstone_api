import { Module } from '@nestjs/common';
import { ExamSeatsModule } from '@app/exam-seats';
import { ExamSessionsCoreModule } from '@app/exam-sessions';
import { ExamSeatsController } from './exam-seats.controller';
import { ChangeExamSeatStatusHandler } from './use-cases/change-seat-status/change-seat-status.handler';
import { GetAllExamSeatsHandler } from './use-cases/get-all-exam-seats/get-all-exam-seats.handler';
import { GetExamSeatsBySessionHandler } from './use-cases/get-exam-seats-by-session/get-exam-seats-by-session.handler';

@Module({
    imports: [ExamSeatsModule, ExamSessionsCoreModule],
    controllers: [ExamSeatsController],
    providers: [
        ChangeExamSeatStatusHandler,
        GetAllExamSeatsHandler,
        GetExamSeatsBySessionHandler,
    ],
    exports: [
        ChangeExamSeatStatusHandler,
        GetAllExamSeatsHandler,
        GetExamSeatsBySessionHandler,
    ],
})
export class AppExamSeatsModule { }
