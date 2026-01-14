import { Inject, Injectable } from '@nestjs/common';
import { IExamRoomRepository, EXAM_ROOM_REPOSITORY } from '@app/exam-rooms';
import { ExamRoomResponse, toExamRoomResponse } from '../../shared/exam-room.response';

@Injectable()
export class GetExamRoomHandler {
    constructor(
        @Inject(EXAM_ROOM_REPOSITORY)
        private readonly examRoomRepository: IExamRoomRepository,
    ) { }

    async execute(id: string): Promise<ExamRoomResponse> {
        const examRoom = await this.examRoomRepository.findById(id);
        if (!examRoom) {
            throw new Error(`ExamRoom with id '${id}' not found`);
        }

        return toExamRoomResponse(examRoom);
    }
}
