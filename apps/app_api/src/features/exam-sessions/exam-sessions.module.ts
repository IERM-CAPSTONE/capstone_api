import { Module } from '@nestjs/common';
import { ExamSessionsCoreModule } from '@app/exam-sessions';

import { CreateExamSessionHandler, CreateExamSessionEndpoint } from './use-cases/create-exam-session';
import { UpdateExamSessionHandler, UpdateExamSessionEndpoint } from './use-cases/update-exam-session';
import { DeleteExamSessionHandler, DeleteExamSessionEndpoint } from './use-cases/delete-exam-session';
import { GetExamSessionHandler, GetExamSessionEndpoint } from './use-cases/get-exam-session';
import { ListExamSessionsHandler, ListExamSessionsEndpoint } from './use-cases/list-exam-sessions';
import { ImportExamSessionHandler, ImportExamSessionEndpoint } from './use-cases/import-exam-session';

@Module({
    imports: [ExamSessionsCoreModule],
    controllers: [
        CreateExamSessionEndpoint,
        UpdateExamSessionEndpoint,
        DeleteExamSessionEndpoint,
        GetExamSessionEndpoint,
        ListExamSessionsEndpoint,
        ImportExamSessionEndpoint,
    ],
    providers: [
        CreateExamSessionHandler,
        UpdateExamSessionHandler,
        DeleteExamSessionHandler,
        GetExamSessionHandler,
        ListExamSessionsHandler,
        ImportExamSessionHandler,
    ],
})
export class ExamSessionsModule { }
