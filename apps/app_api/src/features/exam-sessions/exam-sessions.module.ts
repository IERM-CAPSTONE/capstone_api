import { Module } from '@nestjs/common';
import { ExamSessionsCoreModule } from '@app/exam-sessions';
import { ExamSeatsModule } from '@app/exam-seats';

import { CreateExamSessionHandler, CreateExamSessionEndpoint } from './use-cases/create-exam-session';
import { UpdateExamSessionHandler, UpdateExamSessionEndpoint } from './use-cases/update-exam-session';
import { DeleteExamSessionHandler, DeleteExamSessionEndpoint } from './use-cases/delete-exam-session';
import { GetExamSessionHandler, GetExamSessionEndpoint } from './use-cases/get-exam-session';
import { ListExamSessionsHandler, ListExamSessionsEndpoint } from './use-cases/list-exam-sessions';
import { ImportScheduleHandler, ImportScheduleEndpoint } from './use-cases/import-schedule';
import { ImportProctorHandler, ImportProctorEndpoint } from './use-cases/import-proctor';
import { ImportExamCodeHandler, ImportExamCodeEndpoint } from './use-cases/import-exam-code';
import { ArchiveExamSessionHandler, ArchiveExamSessionEndpoint } from './use-cases/archive-exam-session';
import { FinalizeSeatAssignmentsHandler, FinalizeSeatAssignmentsEndpoint } from './use-cases/finalize-seats';
import { AutoGenerateScheduleHandler, AutoGenerateScheduleEndpoint } from './use-cases/auto-generate-schedule';

@Module({
    imports: [ExamSessionsCoreModule, ExamSeatsModule],
    controllers: [
        CreateExamSessionEndpoint,
        UpdateExamSessionEndpoint,
        DeleteExamSessionEndpoint,
        GetExamSessionEndpoint,
        ListExamSessionsEndpoint,
        ImportScheduleEndpoint,
        ImportProctorEndpoint,
        ImportExamCodeEndpoint,
        ArchiveExamSessionEndpoint,
        FinalizeSeatAssignmentsEndpoint,
        AutoGenerateScheduleEndpoint,
    ],
    providers: [
        CreateExamSessionHandler,
        UpdateExamSessionHandler,
        DeleteExamSessionHandler,
        GetExamSessionHandler,
        ListExamSessionsHandler,
        ImportScheduleHandler,
        ImportProctorHandler,
        ImportExamCodeHandler,
        ArchiveExamSessionHandler,
        FinalizeSeatAssignmentsHandler,
        AutoGenerateScheduleHandler,
    ],
})
export class ExamSessionsModule { }
