import { Module } from '@nestjs/common';
import { SubjectsCoreModule } from '@app/subjects';
import { CreateSubjectHandler } from './use-cases/create-subject/create-subject.handler';
import { CreateSubjectEndpoint } from './use-cases/create-subject/create-subject.endpoint';
import { ListSubjectsHandler } from './use-cases/list-subjects/list-subjects.handler';
import { ListSubjectsEndpoint } from './use-cases/list-subjects/list-subjects.endpoint';
import { GetSubjectHandler } from './use-cases/get-subject/get-subject.handler';
import { GetSubjectEndpoint } from './use-cases/get-subject/get-subject.endpoint';
import { UpdateSubjectHandler } from './use-cases/update-subject/update-subject.handler';
import { UpdateSubjectEndpoint } from './use-cases/update-subject/update-subject.endpoint';
import { DeleteSubjectHandler } from './use-cases/delete-subject/delete-subject.handler';
import { DeleteSubjectEndpoint } from './use-cases/delete-subject/delete-subject.endpoint';
import { ImportSubjectsEndpoint, ImportSubjectsHandler } from './use-cases/import-subjects';

@Module({
    imports: [SubjectsCoreModule],
    controllers: [
        CreateSubjectEndpoint,
        ListSubjectsEndpoint,
        GetSubjectEndpoint,
        UpdateSubjectEndpoint,
        DeleteSubjectEndpoint,
        ImportSubjectsEndpoint,
    ],
    providers: [
        CreateSubjectHandler,
        ListSubjectsHandler,
        GetSubjectHandler,
        UpdateSubjectHandler,
        DeleteSubjectHandler,
        ImportSubjectsHandler,
    ],
})
export class AppSubjectsModule { }
