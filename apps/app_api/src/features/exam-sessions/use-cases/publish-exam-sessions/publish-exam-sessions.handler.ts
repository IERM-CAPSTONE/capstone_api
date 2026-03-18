import { Inject, Injectable } from '@nestjs/common';
import { IExamSessionRepository, EXAM_SESSION_REPOSITORY } from '@app/exam-sessions';
import { PublishExamSessionsDto } from './publish-exam-sessions.dto';

@Injectable()
export class PublishExamSessionsHandler {
    constructor(
        @Inject(EXAM_SESSION_REPOSITORY)
        private readonly repository: IExamSessionRepository,
    ) { }

    async execute(dto: PublishExamSessionsDto): Promise<{ success: boolean; count: number }> {
        let count = 0;

        if (dto.sessionIds && dto.sessionIds.length > 0) {
            count = await this.repository.updateStatusBulk(dto.sessionIds, 'Scheduled');
        } else if (dto.semesterId && dto.campus) {
            count = await this.repository.publishGeneratedDrafts(dto.semesterId, dto.campus);
        } else if (dto.semesterId) {
            // Publish ALL draft sessions for this semester across all campuses
            count = await this.repository.publishAllDraftsForSemester(dto.semesterId);
        }

        return {
            success: true,
            count
        };
    }
}
