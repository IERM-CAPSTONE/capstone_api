import { Module } from '@nestjs/common';
import { ExamRoomsCoreModule } from '@app/exam-rooms';

// Use Cases
import { CreateExamRoomHandler, CreateExamRoomEndpoint } from './use-cases/create-exam-room';
import { UpdateExamRoomHandler, UpdateExamRoomEndpoint } from './use-cases/update-exam-room';
import { DeleteExamRoomHandler, DeleteExamRoomEndpoint } from './use-cases/delete-exam-room';
import { GetExamRoomHandler, GetExamRoomEndpoint } from './use-cases/get-exam-room';
import { ListExamRoomsHandler, ListExamRoomsEndpoint } from './use-cases/list-exam-rooms';
import { ImportExamRoomHandler, ImportExamRoomEndpoint } from './use-cases/import-exam-room';

@Module({
    imports: [ExamRoomsCoreModule],
    controllers: [
        CreateExamRoomEndpoint,
        UpdateExamRoomEndpoint,
        DeleteExamRoomEndpoint,
        GetExamRoomEndpoint,
        ListExamRoomsEndpoint,
        ImportExamRoomEndpoint,
    ],
    providers: [
        CreateExamRoomHandler,
        UpdateExamRoomHandler,
        DeleteExamRoomHandler,
        GetExamRoomHandler,
        ListExamRoomsHandler,
        ImportExamRoomHandler,
    ],
})
export class ExamRoomsModule { }
