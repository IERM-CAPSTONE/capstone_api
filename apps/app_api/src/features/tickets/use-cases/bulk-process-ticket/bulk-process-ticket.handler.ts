import { Injectable } from '@nestjs/common';
import { BulkProcessTicketDto } from './bulk-process-ticket.dto';
import { TicketWorkflowService } from '../../ticket-workflow.service';
import { ProcessTicketHandler } from '../process-ticket/process-ticket.handler';

export interface BulkProcessResult {
    processed: number;
    failed: number;
    details: { ticketId: string; success: boolean; error?: string }[];
}

@Injectable()
export class BulkProcessTicketHandler {
    constructor(
        private readonly workflow: TicketWorkflowService,
        private readonly legacyProcessHandler: ProcessTicketHandler,
    ) { }

    async execute(dto: BulkProcessTicketDto, actorId: string): Promise<BulkProcessResult> {
        const details: BulkProcessResult['details'] = [];

        for (const ticketId of dto.ticketIds) {
            try {
                if (dto.action === 'COMMENT') {
                    await this.workflow.addComment(ticketId, actorId, dto.mode ?? 'DISCUSSION', {
                        body: dto.body ?? dto.note ?? '',
                        issueCode: dto.issueCode ?? null,
                        issueType: dto.issueType ?? null,
                        issueCustomText: dto.issueCustomText ?? null,
                        resolutionCode: dto.resolutionCode ?? null,
                        resolutionCustomText: dto.resolutionCustomText ?? null,
                        responseText: dto.responseText ?? null,
                        techNote: dto.techNote ?? null,
                        useForAiTraining: dto.useForAiTraining ?? null,
                    });
                } else if (dto.action === 'ROUTE') {
                    await this.workflow.routeTicket(ticketId, actorId, dto.targetRole!, dto.note);
                } else if (dto.action === 'LIFECYCLE') {
                    if (dto.lifecycleAction === 'START') {
                        await this.workflow.setStatus(ticketId, actorId, 'IN_PROGRESS', dto.note);
                    } else if (dto.lifecycleAction === 'REOPEN') {
                        await this.workflow.setStatus(ticketId, actorId, 'IN_PROGRESS', dto.note);
                    } else if (dto.lifecycleAction === 'ACKNOWLEDGE') {
                        await this.workflow.setStatus(ticketId, actorId, 'CLOSED', dto.note);
                    } else if (dto.lifecycleAction === 'CLOSE') {
                        await this.workflow.setStatus(ticketId, actorId, 'CLOSED', dto.note);
                    } else {
                        throw new Error(`Unsupported lifecycle action ${dto.lifecycleAction}`);
                    }
                } else {
                    await this.legacyProcessHandler.execute(ticketId, dto as any, actorId);
                }
                details.push({ ticketId, success: true });
            } catch (error: any) {
                details.push({
                    ticketId,
                    success: false,
                    error: error?.message ?? 'Unknown error',
                });
            }
        }

        return {
            processed: details.filter((detail) => detail.success).length,
            failed: details.filter((detail) => !detail.success).length,
            details,
        };
    }
}
