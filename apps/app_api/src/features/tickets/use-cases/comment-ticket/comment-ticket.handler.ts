import { Injectable } from '@nestjs/common';
import { CommentTicketDto } from './comment-ticket.dto';
import { TicketWorkflowService } from '../../ticket-workflow.service';

@Injectable()
export class CommentTicketHandler {
    constructor(
        private readonly workflow: TicketWorkflowService,
    ) { }

    async execute(ticketId: string, dto: CommentTicketDto, actorId: string): Promise<any> {
        return this.workflow.addComment(ticketId, actorId, dto.mode ?? 'DISCUSSION', {
            body: dto.body ?? dto.content ?? '',
            issueCode: dto.issueCode ?? dto.finalIssueName ?? null,
            issueType: dto.issueType ?? dto.finalIssueType ?? null,
            issueCustomText: dto.issueCustomText ?? dto.finalIssueCustomText ?? null,
            resolutionCode: dto.resolutionCode ?? null,
            resolutionCustomText: dto.resolutionCustomText ?? null,
            responseText: dto.responseText ?? dto.resolutionStandardText ?? null,
            techNote: dto.techNote ?? null,
            useForAiTraining: dto.useForAiTraining ?? null,
        });
    }
}
