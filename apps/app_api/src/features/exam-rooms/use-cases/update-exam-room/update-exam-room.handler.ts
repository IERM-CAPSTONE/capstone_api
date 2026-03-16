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

        // Check room number uniqueness within campus if changing roomNumber or campus
        const newRoomNumber = dto.roomNumber ?? existingExamRoom.roomNumber.value;
        const newCampus = dto.campus ?? existingExamRoom.campus;

        if (dto.roomNumber !== undefined || dto.campus !== undefined) {
            if (newRoomNumber !== existingExamRoom.roomNumber.value || newCampus !== existingExamRoom.campus) {
                if (await this.examRoomRepository.exists({ roomNumber: newRoomNumber, campus: newCampus })) {
                    throw new Error(`Room number '${newRoomNumber}' already exists in campus '${newCampus || 'default'}'`);
                }
            }
        }

        // Update aggregate
        const updatedExamRoom = existingExamRoom.update({
            roomNumber: dto.roomNumber,
            capacity: dto.capacity,
            status: dto.status,
            maxRows: dto.maxRows,
            maxColumns: dto.maxColumns,
            totalSeats: dto.totalSeats,
            campus: dto.campus,
        });

        // Persist
        const savedExamRoom = await this.examRoomRepository.save(updatedExamRoom);

        // Invalidate cache
        await this.cacheService.delByPrefix('exam-rooms:list');

        return toExamRoomResponse(savedExamRoom);
    }
}
