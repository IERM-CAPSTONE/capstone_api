import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { TICKET_REPOSITORY, ITicketRepository } from '../domain';

@Injectable()
export class PrismaTicketRepository implements ITicketRepository {
    constructor(private readonly prisma: PrismaService) { }

    private decorateTicket(ticket: any): any {
        const aiCandidates = ticket.aiCandidates ?? [];
        const pendingCount = aiCandidates.filter((candidate: any) => candidate.reviewStatus === 'PENDING_REVIEW').length;

        const latestSummary =
            ticket.latestSummary ??
            [...(ticket.activityHistories ?? [])]
                .reverse()
                .map((history: any) => {
                    try {
                        const parsed = JSON.parse(history.description);
                        if (parsed?.meta?.body?.trim()) return parsed.meta.body.trim();
                    } catch { }
                    return history.note?.trim?.() || null;
                })
                .find((value: string | null) => !!value) ??
            ticket.description ??
            null;

        return {
            ...ticket,
            latestSummary,
            needsAiReview: pendingCount > 0,
            aiCandidates,
        };
    }

    async save(data: any): Promise<any> {
        if (data.id) {
            // Update existing
            const ticket = await (this.prisma as any).issueTicket.update({
                where: { id: data.id },
                data: {
                    status: data.status,
                    assigneeId: data.assigneeId,
                    resolveNote: data.resolveNote,
                    techNote: data.techNote,
                    priority: data.priority,
                    description: data.description,
                    attachment: data.attachment,
                    finalIssueName: data.finalIssueName,
                    finalIssueType: data.finalIssueType,
                    finalIssueCustomText: data.finalIssueCustomText,
                    resolutionCode: data.resolutionCode,
                    resolutionCustomText: data.resolutionCustomText,
                    resolutionStandardText: data.resolutionStandardText,
                    latestSummary: data.latestSummary,
                    resolvedBy: data.resolvedBy,
                    resolvedAt: data.resolvedAt,
                    needsAiReview: data.needsAiReview,
                    aiTrainingStatus: data.aiTrainingStatus,
                    reviewedBy: data.reviewedBy,
                    reviewedAt: data.reviewedAt,
                    reviewNote: data.reviewNote,
                } as any,
                include: {
                    reporter: true,
                    assignee: true,
                    session: true,
                    aiCandidates: true,
                    activityHistories: { orderBy: { createdAt: 'asc' } },
                },
            });
            return this.decorateTicket(ticket);
        }

        // Create new
        const ticket = await (this.prisma as any).issueTicket.create({
            data: {
                issueName: data.issueName,
                issueType: data.issueType,
                description: data.description,
                priority: data.priority ?? 'Normal',
                status: data.status ?? 'OPEN',
                reporterId: data.reporterId,
                assigneeId: data.assigneeId ?? null,
                sessionId: data.sessionId ?? null,
                attachment: data.attachment ?? null,
                studentCode: data.studentCode ?? null,
                ocrText: data.ocrText ?? null,
                aiPredictedIssueName: data.aiPredictedIssueName ?? null,
                aiPredictedIssueType: data.aiPredictedIssueType ?? null,
                aiConfidence: data.aiConfidence ?? null,
                aiDisplayMessage: data.aiDisplayMessage ?? null,
                aiEvidenceText: data.aiEvidenceText ?? null,
                aiModelVersion: data.aiModelVersion ?? null,
                aiRecommendedAssignmentType: data.aiRecommendedAssignmentType ?? null,
                confirmedAssignmentType: data.confirmedAssignmentType ?? null,
            } as any,
            include: {
                reporter: true,
                assignee: true,
                session: { include: { examRoom: true } },
                aiCandidates: true,
                activityHistories: { orderBy: { createdAt: 'asc' } },
            },
        });
        return this.decorateTicket(ticket);
    }

    async findById(id: string): Promise<any | null> {
        const ticket = await (this.prisma as any).issueTicket.findUnique({
            where: { id },
            include: {
                reporter: { select: { id: true, fullName: true, email: true, role: true } },
                assignee: { select: { id: true, fullName: true, email: true, role: true } },
                session: { include: { examRoom: { select: { id: true, roomNumber: true } } } },
                activityHistories: {
                    orderBy: { createdAt: 'asc' },
                },
                aiCandidates: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        return ticket ? this.decorateTicket(ticket) : null;
    }

    async findMany(filters: {
        status?: string;
        reporterId?: string;
        assigneeId?: string;
        issueType?: string;
        sessionId?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<any[]> {
        const where: any = {};

        if (filters.status) where.status = filters.status;
        if (filters.reporterId) where.reporterId = filters.reporterId;
        if (filters.assigneeId) where.assigneeId = filters.assigneeId;
        if (filters.issueType) where.issueType = filters.issueType;
        if (filters.sessionId) where.sessionId = filters.sessionId;

        if (filters.fromDate || filters.toDate) {
            where.createdAt = {};
            if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
            if (filters.toDate) {
                const to = new Date(filters.toDate);
                to.setHours(23, 59, 59, 999);
                where.createdAt.lte = to;
            }
        }

        const tickets = await (this.prisma as any).issueTicket.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                reporter: { select: { id: true, fullName: true, email: true, role: true } },
                assignee: { select: { id: true, fullName: true, email: true, role: true } },
                session: {
                    include: {
                        examRoom: { select: { id: true, roomNumber: true } },
                    },
                },
                activityHistories: {
                    orderBy: { createdAt: 'asc' },
                },
                aiCandidates: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        return tickets.map((ticket: any) => this.decorateTicket(ticket));
    }
}
