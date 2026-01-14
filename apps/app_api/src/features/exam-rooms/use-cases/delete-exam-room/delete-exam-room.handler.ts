import { Inject, Injectable } from '@nestjs/common';
import { IExamRoomRepository, EXAM_ROOM_REPOSITORY } from '@app/exam-rooms';
import { CACHE_SERVICE, ICacheService } from '@app/cache';

@Injectable()
export class DeleteExamRoomHandler {
    constructor(
        @Inject(EXAM_ROOM_REPOSITORY)
        private readonly examRoomRepository: IExamRoomRepository,
        @Inject(CACHE_SERVICE)
        private readonly cacheService: ICacheService,
    ) { }

    async execute(id: string): Promise<void> {
        // Check if exam room exists
        const existingExamRoom = await this.examRoomRepository.findById(id);
        if (!existingExamRoom) {
            throw new Error(`ExamRoom with id '${id}' not found`);
        }

        // Delete
        await this.examRoomRepository.delete(id);

        // Invalidate cache
        await this.cacheService.delByPrefix('exam-rooms:list');
    }
}
