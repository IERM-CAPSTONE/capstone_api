import { Inject, Injectable } from '@nestjs/common';
import { IExamRoomRepository, EXAM_ROOM_REPOSITORY } from '@app/exam-rooms';
import { CACHE_SERVICE, ICacheService } from '@app/cache';
import { ExamRoomResponse, toExamRoomResponse } from '../../shared/exam-room.response';
import { UpdateExamRoomDto } from './update-exam-room.dto';

@Injectable()
export class UpdateExamRoomHandler {
    constructor(
        @Inject(EXAM_ROOM_REPOSITORY)
        private readonly examRoomRepository: IExamRoomRepository,
        @Inject(CACHE_SERVICE)
        private readonly cacheService: ICacheService,
    ) { }

    async execute(id: string, dto: UpdateExamRoomDto): Promise<ExamRoomResponse> {
        // Find existing exam room
        const existingExamRoom = await this.examRoomRepository.findById(id);
        if (!existingExamRoom) {
            throw new Error(`ExamRoom with id '${id}' not found`);
        }

        // Check room number uniqueness if changing
        if (dto.roomNumber !== undefined && dto.roomNumber !== existingExamRoom.roomNumber.value) {
            if (await this.examRoomRepository.exists({ roomNumber: dto.roomNumber })) {
                throw new Error(`Room number '${dto.roomNumber}' already exists`);
            }
        }

        // Update aggregate
        const updatedExamRoom = existingExamRoom.update({
            roomNumber: dto.roomNumber,
            capacity: dto.capacity,
        });

        // Persist
        const savedExamRoom = await this.examRoomRepository.save(updatedExamRoom);

        // Invalidate cache
        await this.cacheService.delByPrefix('exam-rooms:list');

        return toExamRoomResponse(savedExamRoom);
    }
}
