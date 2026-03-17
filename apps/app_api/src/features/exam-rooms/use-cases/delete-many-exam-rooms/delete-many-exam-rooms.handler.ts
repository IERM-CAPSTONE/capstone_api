import { Inject, Injectable } from '@nestjs/common';
import { IExamRoomRepository, EXAM_ROOM_REPOSITORY } from '@app/exam-rooms';
import { CACHE_SERVICE, ICacheService } from '@app/cache';

@Injectable()
export class DeleteManyExamRoomsHandler {
    constructor(
        @Inject(EXAM_ROOM_REPOSITORY)
        private readonly examRoomRepository: IExamRoomRepository,
        @Inject(CACHE_SERVICE)
        private readonly cacheService: ICacheService,
    ) { }

    async execute(query: { roomNumber?: string; campus?: string }): Promise<number> {
        // Delete many
        const count = await this.examRoomRepository.deleteMany(query);

        // Invalidate cache
        if (count > 0) {
            await this.cacheService.delByPrefix('exam-rooms:list');
        }

        return count;
    }
}
