import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { EXAM_ROOM_REPOSITORY } from './domain/repositories';
import { PrismaExamRoomRepository } from './infrastructure';

/**
 * ExamRooms Core Module
 * Provides domain and infrastructure services for exam rooms
 */
@Global()
@Module({
    imports: [PrismaModule],
    providers: [
        {
            provide: EXAM_ROOM_REPOSITORY,
            useClass: PrismaExamRoomRepository,
        },
    ],
    exports: [EXAM_ROOM_REPOSITORY],
})
export class ExamRoomsCoreModule { }
