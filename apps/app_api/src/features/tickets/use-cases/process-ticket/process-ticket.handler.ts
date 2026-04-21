import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { ProcessAction, ProcessTicketDto } from './process-ticket.dto';
import { TicketWorkflowService } from '../../ticket-workflow.service';

@Injectable()
export class ProcessTicketHandler {
    constructor(
        private readonly workflow: TicketWorkflowService,
        private readonly prisma: PrismaService,
    ) { }

    async execute(ticketId: string, dto: ProcessTicketDto, actorId: string): Promise<any> {
        const ticket = await this.workflow.getTicketOrThrow(ticketId);

        const inferredIssueCode =
            dto.finalIssueName ??
            ticket.finalIssueName ??
            ticket.issueName ??
            'OTHER';
        const inferredIssueType =
            dto.finalIssueType ??
            ticket.finalIssueType ??
            ticket.issueType ??
            'Technical Issue';
        const inferredResolutionCode =
            dto.resolutionCode ??
            ticket.resolutionCode ??
            'CUSTOM';
        const inferredResolutionCustomText =
            dto.resolutionCustomText ??
            dto.note ??
            dto.resolveNote ??
            ticket.resolutionCustomText ??
            'Resolved';
        const inferredResponseText =
            dto.resolutionStandardText ??
            dto.note ??
            dto.resolveNote ??
            ticket.resolutionStandardText ??
            'Resolved';

        if (dto.action === ProcessAction.START) {
            return this.workflow.applyLifecycle(ticketId, actorId, 'START', dto.note);
        }

        if (dto.action === ProcessAction.RESOLVE) {
            return this.workflow.addComment(ticketId, actorId, 'RESOLUTION', {
                body: dto.note ?? dto.resolveNote ?? 'Resolved',
                issueCode: inferredIssueCode,
                issueType: inferredIssueType,
                issueCustomText: dto.finalIssueCustomText ?? null,
                resolutionCode: inferredResolutionCode,
                resolutionCustomText:
                    inferredResolutionCode === 'CUSTOM'
                        ? inferredResolutionCustomText
                        : dto.resolutionCustomText ?? null,
                responseText: inferredResponseText,
                techNote: dto.note ?? null,
            });
        }

        if (
            dto.action === ProcessAction.ASSIGN ||
            dto.action === ProcessAction.REASSIGN
        ) {
            if (!dto.assigneeId) {
                throw new BadRequestException('assigneeId is required for legacy assign/reassign');
            }

            const assignee = await (this.prisma as any).user.findUnique({
                where: { id: dto.assigneeId },
                select: { role: true },
            });

            if (!assignee?.role || !['HALL_INVIGILATOR', 'EXAM_OFFICER', 'IT_SUPPORT'].includes(assignee.role)) {
                throw new BadRequestException('Legacy assign/reassign can only target HALL_INVIGILATOR, EXAM_OFFICER, or IT_SUPPORT');
            }

            return this.workflow.routeTicket(ticketId, actorId, assignee.role, dto.note);
        }

        if (dto.action === ProcessAction.CHANGE_STATUS) {
            switch (dto.status) {
                case 'OPEN':
                case 'IN_PROGRESS':
                case 'SOLVED':
                case 'CLOSED':
                    return this.workflow.setStatus(ticketId, actorId, dto.status, dto.note);
                default:
                    throw new BadRequestException(`Unsupported legacy status ${dto.status ?? 'undefined'}`);
            }
        }

        throw new BadRequestException(`Unsupported legacy action ${dto.action}`);
    }
}
