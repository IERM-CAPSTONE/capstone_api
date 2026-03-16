import { Module } from '@nestjs/common';
import { ExamRoomsCoreModule } from '@app/exam-rooms';

// Use Cases
import { CreateExamRoomHandler, CreateExamRoomEndpoint } from './use-cases/create-exam-room';
import { UpdateExamRoomHandler, UpdateExamRoomEndpoint } from './use-cases/update-exam-room';
import { DeleteExamRoomHandler, DeleteExamRoomEndpoint } from './use-cases/delete-exam-room';
import { GetExamRoomHandler, GetExamRoomEndpoint } from './use-cases/get-exam-room';
import { ListExamRoomsHandler, ListExamRoomsEndpoint } from './use-cases/list-exam-rooms';
import { ImportExamRoomHandler, ImportExamRoomEndpoint } from './use-cases/import-exam-room';
import { DeleteManyExamRoomsHandler, DeleteManyExamRoomsEndpoint } from './use-cases/delete-many-exam-rooms';

@Module({
    imports: [ExamRoomsCoreModule],
    controllers: [
        CreateExamRoomEndpoint,
        ListExamRoomsEndpoint,
        ImportExamRoomEndpoint,
        DeleteManyExamRoomsEndpoint,
        GetExamRoomEndpoint,
        UpdateExamRoomEndpoint,
        DeleteExamRoomEndpoint,
    ],
    providers: [
        CreateExamRoomHandler,
        UpdateExamRoomHandler,
        DeleteExamRoomHandler,
        GetExamRoomHandler,
        ListExamRoomsHandler,
        ImportExamRoomHandler,
        DeleteManyExamRoomsHandler,
    ],
})
export class ExamRoomsModule { }
