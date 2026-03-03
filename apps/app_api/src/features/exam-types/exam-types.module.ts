import { Module } from '@nestjs/common';
import { ExamTypesCoreModule } from '@app/exam-types';
import { CreateExamTypeHandler } from './use-cases/create-exam-type/create-exam-type.handler';
import { CreateExamTypeEndpoint } from './use-cases/create-exam-type/create-exam-type.endpoint';
import { ListExamTypesHandler } from './use-cases/list-exam-types/list-exam-types.handler';
import { ListExamTypesEndpoint } from './use-cases/list-exam-types/list-exam-types.endpoint';
import { UpdateExamTypeHandler } from './use-cases/update-exam-type/update-exam-type.handler';
import { UpdateExamTypeEndpoint } from './use-cases/update-exam-type/update-exam-type.endpoint';
import { DeleteExamTypeHandler } from './use-cases/delete-exam-type/delete-exam-type.handler';
import { DeleteExamTypeEndpoint } from './use-cases/delete-exam-type/delete-exam-type.endpoint';

@Module({
    imports: [ExamTypesCoreModule],
    controllers: [
        CreateExamTypeEndpoint,
        ListExamTypesEndpoint,
        UpdateExamTypeEndpoint,
        DeleteExamTypeEndpoint,
    ],
    providers: [
        CreateExamTypeHandler,
        ListExamTypesHandler,
        UpdateExamTypeHandler,
        DeleteExamTypeHandler,
    ],
})
export class AppExamTypesModule { }
