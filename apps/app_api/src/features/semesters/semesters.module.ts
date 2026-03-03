import { Module } from '@nestjs/common';
import { SemestersCoreModule } from '@app/semesters';
import { CreateSemesterEndpoint } from './use-cases/create-semester/create-semester.endpoint';
import { CreateSemesterHandler } from './use-cases/create-semester/create-semester.handler';
import { ListSemestersEndpoint } from './use-cases/list-semesters/list-semesters.endpoint';
import { ListSemestersHandler } from './use-cases/list-semesters/list-semesters.handler';
import { UpdateSemesterEndpoint } from './use-cases/update-semester/update-semester.endpoint';
import { UpdateSemesterHandler } from './use-cases/update-semester/update-semester.handler';
import { DeleteSemesterEndpoint } from './use-cases/delete-semester/delete-semester.endpoint';
import { DeleteSemesterHandler } from './use-cases/delete-semester/delete-semester.handler';
import { GetSemesterEndpoint } from './use-cases/get-semester/get-semester.endpoint';
import { GetSemesterHandler } from './use-cases/get-semester/get-semester.handler';

@Module({
    imports: [SemestersCoreModule],
    controllers: [
        CreateSemesterEndpoint,
        ListSemestersEndpoint,
        UpdateSemesterEndpoint,
        DeleteSemesterEndpoint,
        GetSemesterEndpoint,
    ],
    providers: [
        CreateSemesterHandler,
        ListSemestersHandler,
        UpdateSemesterHandler,
        DeleteSemesterHandler,
        GetSemesterHandler,
    ],
})
export class SemestersModule { }
