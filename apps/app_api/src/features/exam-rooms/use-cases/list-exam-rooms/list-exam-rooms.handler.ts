import { Inject, Injectable } from '@nestjs/common';
import { IExamRoomRepository, EXAM_ROOM_REPOSITORY } from '@app/exam-rooms';
import { PaginatedExamRoomResponse, toExamRoomResponse } from '../../shared/exam-room.response';
import { ListExamRoomsDto } from './list-exam-rooms.dto';

@Injectable()
export class ListExamRoomsHandler {
    constructor(
        @Inject(EXAM_ROOM_REPOSITORY)
        private readonly examRoomRepository: IExamRoomRepository,
    ) { }

    async execute(dto: ListExamRoomsDto): Promise<PaginatedExamRoomResponse> {
        const page = parseInt(String(dto.page || 1), 10);
        const limit = parseInt(String(dto.limit || 10), 10);
        const skip = (page - 1) * limit;


        const query: any = {
            skip,
            take: limit,
        };

        if (dto.roomNumber !== undefined) {
            query.roomNumber = dto.roomNumber;
        }

        if (dto.campus !== undefined) {
            query.campus = dto.campus;
        }

        const [examRooms, total] = await Promise.all([
            this.examRoomRepository.findMany(query),
            this.examRoomRepository.count({
                roomNumber: dto.roomNumber,
                campus: dto.campus,
            }),
        ]);

        const response = {
            data: examRooms.map(toExamRoomResponse),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };

        return response;
    }
}
