import { Module } from '@nestjs/common';
import { ExamSessionsCoreModule } from '@app/exam-sessions';

import { CreateExamSessionHandler, CreateExamSessionEndpoint } from './use-cases/create-exam-session';
import { UpdateExamSessionHandler, UpdateExamSessionEndpoint } from './use-cases/update-exam-session';
import { DeleteExamSessionHandler, DeleteExamSessionEndpoint } from './use-cases/delete-exam-session';
import { GetExamSessionHandler, GetExamSessionEndpoint } from './use-cases/get-exam-session';
import { ListExamSessionsHandler, ListExamSessionsEndpoint } from './use-cases/list-exam-sessions';
import { ImportScheduleHandler, ImportScheduleEndpoint } from './use-cases/import-schedule';
import { ImportProctorHandler, ImportProctorEndpoint } from './use-cases/import-proctor';
import { ImportExamCodeHandler, ImportExamCodeEndpoint } from './use-cases/import-exam-code';
import { ArchiveExamSessionHandler, ArchiveExamSessionEndpoint } from './use-cases/archive-exam-session';

@Module({
    imports: [ExamSessionsCoreModule],
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
    ],
})
export class ExamSessionsModule { }
