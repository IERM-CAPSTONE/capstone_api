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
            // If only semester is provided, maybe publish all drafts for that semester?
            // Not implemented campus-wide yet but we can do it if needed
            // For now we follow the user's specific campus/semester context usually found in UI
        }

        return {
            success: true,
            count
        };
    }
}
