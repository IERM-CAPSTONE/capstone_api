import { Module } from '@nestjs/common';
import { ExamPartsCoreModule } from '@app/exam-parts';
import { CreateExamPartHandler } from './use-cases/create-exam-part/create-exam-part.handler';
import { CreateExamPartEndpoint } from './use-cases/create-exam-part/create-exam-part.endpoint';
import { ListExamPartsHandler } from './use-cases/list-exam-parts/list-exam-parts.handler';
import { ListExamPartsEndpoint } from './use-cases/list-exam-parts/list-exam-parts.endpoint';
import { UpdateExamPartHandler } from './use-cases/update-exam-part/update-exam-part.handler';
import { UpdateExamPartEndpoint } from './use-cases/update-exam-part/update-exam-part.endpoint';
import { DeleteExamPartHandler } from './use-cases/delete-exam-part/delete-exam-part.handler';
import { DeleteExamPartEndpoint } from './use-cases/delete-exam-part/delete-exam-part.endpoint';

@Module({
    imports: [ExamPartsCoreModule],
    controllers: [
        CreateExamPartEndpoint,
        ListExamPartsEndpoint,
        UpdateExamPartEndpoint,
        DeleteExamPartEndpoint,
    ],
    providers: [
        CreateExamPartHandler,
        ListExamPartsHandler,
        UpdateExamPartHandler,
        DeleteExamPartHandler,
    ],
})
export class AppExamPartsModule { }
