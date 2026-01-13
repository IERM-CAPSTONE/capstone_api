import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ExamRoom, IExamRoomRepository, EXAM_ROOM_REPOSITORY } from '@app/exam-rooms';
import { CACHE_SERVICE, ICacheService } from '@app/cache';
import { ExamRoomResponse, toExamRoomResponse } from '../../shared/exam-room.response';
import { CreateExamRoomDto } from './create-exam-room.dto';

@Injectable()
export class CreateExamRoomHandler {
    constructor(
        @Inject(EXAM_ROOM_REPOSITORY)
        private readonly examRoomRepository: IExamRoomRepository,
        @Inject(CACHE_SERVICE)
        private readonly cacheService: ICacheService,
    ) { }

    async execute(dto: CreateExamRoomDto): Promise<ExamRoomResponse> {
        // Validation
        if (!dto.roomNumber || dto.roomNumber.trim() === '') {
            throw new Error('Room number must not be empty');
        }

        // Check room number uniqueness
        if (await this.examRoomRepository.exists({ roomNumber: dto.roomNumber })) {
            throw new Error(`Room number '${dto.roomNumber}' already exists`);
        }

        // Create aggregate using factory
        const examRoom = ExamRoom.create({
            id: uuidv4(),
            roomNumber: dto.roomNumber,
            capacity: dto.capacity,
        });

        // Persist
        const savedExamRoom = await this.examRoomRepository.save(examRoom);

        // Invalidate cache
        await this.cacheService.delByPrefix('exam-rooms:list');

        return toExamRoomResponse(savedExamRoom);
    }
}
