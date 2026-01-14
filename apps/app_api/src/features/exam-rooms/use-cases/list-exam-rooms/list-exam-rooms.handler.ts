import { Inject, Injectable } from '@nestjs/common';
import { IExamRoomRepository, EXAM_ROOM_REPOSITORY } from '@app/exam-rooms';
import { CACHE_SERVICE, ICacheService } from '@app/cache';
import { PaginatedExamRoomResponse, toExamRoomResponse } from '../../shared/exam-room.response';
import { ListExamRoomsDto } from './list-exam-rooms.dto';

@Injectable()
export class ListExamRoomsHandler {
    constructor(
        @Inject(EXAM_ROOM_REPOSITORY)
        private readonly examRoomRepository: IExamRoomRepository,
        @Inject(CACHE_SERVICE)
        private readonly cacheService: ICacheService,
    ) { }

    async execute(dto: ListExamRoomsDto): Promise<PaginatedExamRoomResponse> {
        const page = dto.page || 1;
        const limit = dto.limit || 10;
        const skip = (page - 1) * limit;

        const cacheKey = `exam-rooms:list:p${page}:l${limit}:rn${dto.roomNumber ?? 'all'}`;
        const cached = await this.cacheService.get<PaginatedExamRoomResponse>(cacheKey);
        if (cached) return cached;

        const query: any = {
            skip,
            take: limit,
        };

        if (dto.roomNumber !== undefined) {
            query.roomNumber = dto.roomNumber;
        }

        const [examRooms, total] = await Promise.all([
            this.examRoomRepository.findMany(query),
            this.examRoomRepository.count(
                dto.roomNumber !== undefined ? { roomNumber: dto.roomNumber } : undefined,
            ),
        ]);

        const response = {
            data: examRooms.map(toExamRoomResponse),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };

        await this.cacheService.set(cacheKey, response, 300000); // 5 mins

        return response;
    }
}
