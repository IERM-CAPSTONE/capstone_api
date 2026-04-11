import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { ReviewTicketDto } from './review-ticket.dto';
import { TicketWorkflowService } from '../../ticket-workflow.service';

@Injectable()
export class ReviewTicketHandler {
    constructor(
        private readonly workflow: TicketWorkflowService,
        private readonly prisma: PrismaService,
    ) { }

    async execute(ticketId: string, candidateId: string | null, dto: ReviewTicketDto, reviewerId: string): Promise<any> {
        const decision = (dto.decision ?? dto.aiTrainingStatus ?? '') as 'APPROVED' | 'REJECTED';
        let resolvedCandidateId = candidateId;
        if (!resolvedCandidateId) {
            const pendingCandidate = await (this.prisma as any).aiCandidate.findFirst({
                where: {
                    ticketId,
                    reviewStatus: 'PENDING_REVIEW',
                },
                orderBy: { createdAt: 'desc' },
                select: { id: true },
            });
            resolvedCandidateId = pendingCandidate?.id ?? null;
        }
        if (!resolvedCandidateId) {
            throw new NotFoundException(`No pending AI candidate found for ticket ${ticketId}`);
        }

        return this.workflow.reviewAiCandidate(ticketId, resolvedCandidateId, reviewerId, {
            decision,
            finalIssueName: dto.finalIssueName ?? null,
            finalIssueType: dto.finalIssueType ?? null,
            resolutionCode: dto.resolutionCode ?? null,
            resolutionStandardText: dto.resolutionStandardText ?? null,
            reviewNote: dto.reviewNote ?? null,
        });
    }
}
