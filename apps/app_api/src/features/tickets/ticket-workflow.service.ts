import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { v4 as uuidv4 } from 'uuid';
import { NotificationGateway } from '../../common/gateways/notification.gateway';

type TicketLike = any;
type ActorLike = any;

export type TicketCommentMode = 'DISCUSSION' | 'CONCLUSION' | 'RESOLUTION';
export type TicketLifecycleAction = 'START' | 'REOPEN' | 'ACKNOWLEDGE' | 'CLOSE';
export type TicketRouteRole = 'HALL_INVIGILATOR' | 'EXAM_OFFICER' | 'IT_SUPPORT';
export type TicketStatusValue = 'OPEN' | 'IN_PROGRESS' | 'SOLVED' | 'CLOSED';

interface StructuredPayload {
    body: string;
    issueCode?: string | null;
    issueType?: string | null;
    issueCustomText?: string | null;
    resolutionCode?: string | null;
    resolutionCustomText?: string | null;
    responseText?: string | null;
    techNote?: string | null;
    useForAiTraining?: boolean | null;
}

@Injectable()
export class TicketWorkflowService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly notificationGateway: NotificationGateway,
    ) { }

    async getTicketOrThrow(ticketId: string): Promise<TicketLike> {
        const ticket = await (this.prisma as any).issueTicket.findUnique({
            where: { id: ticketId },
            include: {
                reporter: { select: { id: true, fullName: true, email: true, role: true } },
                assignee: { select: { id: true, fullName: true, email: true, role: true } },
                session: {
                    include: {
                        examRoom: { select: { id: true, roomNumber: true } },
                    },
                },
                activityHistories: { orderBy: { createdAt: 'asc' } },
                aiCandidates: { orderBy: { createdAt: 'desc' } },
            },
        });

        if (!ticket) {
            throw new NotFoundException(`Ticket ${ticketId} not found`);
        }

        return this.decorateTicket(ticket);
    }

    async getActorOrThrow(actorId: string): Promise<ActorLike> {
        const actor = await (this.prisma as any).user.findUnique({
            where: { id: actorId },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                campus: true,
                createdAt: true,
                lastAssignedAt: true,
            },
        });
        if (!actor) {
            throw new NotFoundException(`Actor ${actorId} not found`);
        }
        return actor;
    }

    decorateTicket(ticket: TicketLike): TicketLike {
        const pendingCandidates = (ticket.aiCandidates ?? []).filter(
            (candidate: any) => candidate.reviewStatus === 'PENDING_REVIEW',
        );

        return {
            ...ticket,
            latestSummary:
                ticket.latestSummary?.trim() ||
                this.extractLatestSummary(ticket.activityHistories ?? [], ticket.description),
            needsAiReview: pendingCandidates.length > 0,
            aiCandidates: ticket.aiCandidates ?? [],
        };
    }

    extractLatestSummary(histories: any[], description?: string | null): string | null {
        for (let index = histories.length - 1; index >= 0; index -= 1) {
            const history = histories[index];
            const payload = this.safeParse(history.description);
            const body = payload?.meta?.body;
            if (typeof body === 'string' && body.trim()) {
                return body.trim();
            }
            if (typeof history.note === 'string' && history.note.trim()) {
                return history.note.trim();
            }
        }

        return description?.trim() || null;
    }

    async addComment(ticketId: string, actorId: string, mode: TicketCommentMode, payload: StructuredPayload): Promise<TicketLike> {
        const ticket = await this.getTicketOrThrow(ticketId);
        const actor = await this.getActorOrThrow(actorId);

        this.assertCommentPermission(ticket, actor, mode);
        this.assertCommentState(ticket, mode);
        this.assertStructuredPayload(mode, payload);

        const body = payload.body.trim();
        const structuredMeta =
            mode === 'DISCUSSION'
                ? { body }
                : {
                    body,
                    issueCode: payload.issueCode ?? null,
                    issueType: payload.issueType ?? null,
                    issueCustomText:
                        payload.issueCode === 'OTHER'
                            ? payload.issueCustomText?.trim() || null
                            : null,
                    resolutionCode: payload.resolutionCode ?? null,
                    resolutionCustomText:
                        payload.resolutionCode === 'CUSTOM'
                            ? payload.resolutionCustomText?.trim() || null
                            : null,
                    responseText: payload.responseText?.trim() || null,
                    techNote: payload.techNote?.trim() || null,
                    useForAiTraining: payload.useForAiTraining === true,
                };

        const activityId = uuidv4();
        const isResolution = mode === 'RESOLUTION';
        const event = isResolution ? 'TICKET_RESOLVED' : 'TICKET_COMMENTED';
        const activityType = isResolution ? 'TICKET_RESOLVED' : 'TICKET_COMMENTED';

        await (this.prisma as any).activityHistory.create({
            data: {
                id: activityId,
                ticketId,
                studentExamId: null,
                activityType,
                description: JSON.stringify({
                    event,
                    title: mode === 'DISCUSSION' ? 'Discussion' : mode === 'CONCLUSION' ? 'Conclusion updated' : 'Resolution note',
                    message:
                        mode === 'DISCUSSION'
                            ? `${actor.fullName ?? 'User'} added a discussion comment`
                            : mode === 'CONCLUSION'
                                ? `${actor.fullName ?? 'User'} updated the current conclusion`
                                : `${actor.fullName ?? 'User'} added a resolution note for AI training`,
                    meta: {
                        mode,
                        actorId,
                        body,
                        ...structuredMeta,
                    },
                }),
                actorId,
                note: body,
            },
        });

        let reviewStatus: 'PENDING_REVIEW' | 'APPROVED' | null = null;
        if (mode === 'CONCLUSION' && payload.useForAiTraining === true) {
            reviewStatus = await this.createAiCandidate(ticketId, activityId, 'CONCLUSION', structuredMeta, actorId);
        }

        if (mode === 'RESOLUTION') {
            reviewStatus = await this.createAiCandidate(ticketId, activityId, 'RESOLUTION', structuredMeta, actorId);
            await (this.prisma as any).issueTicket.update({
                where: { id: ticketId },
                data: {
                    latestSummary: body,
                    finalIssueName: payload.issueCode ?? null,
                    finalIssueType: payload.issueType ?? null,
                    finalIssueCustomText:
                        payload.issueCode === 'OTHER'
                            ? payload.issueCustomText?.trim() || null
                            : null,
                    resolutionCode: payload.resolutionCode ?? null,
                    resolutionCustomText:
                        payload.resolutionCode === 'CUSTOM'
                            ? payload.resolutionCustomText?.trim() || null
                            : null,
                    resolutionStandardText: payload.responseText?.trim() || null,
                    techNote: payload.techNote?.trim() || null,
                    resolveNote: body,
                    needsAiReview: reviewStatus === 'PENDING_REVIEW',
                },
            });
        } else {
            await (this.prisma as any).issueTicket.update({
                where: { id: ticketId },
                data: {
                    latestSummary: body,
                    needsAiReview:
                        reviewStatus === 'PENDING_REVIEW'
                            ? true
                            : undefined,
                },
            });
        }

        return this.getTicketOrThrow(ticketId);
    }

    async routeTicket(ticketId: string, actorId: string, targetRole: TicketRouteRole, reason?: string | null): Promise<TicketLike> {
        const ticket = await this.getTicketOrThrow(ticketId);
        const actor = await this.getActorOrThrow(actorId);

        if (!['EXAM_OFFICER', 'ADMIN', 'PROCTOR', 'HALL_INVIGILATOR'].includes(actor.role)) {
            throw new ForbiddenException('Only exam officers, proctors, hall invigilators, or admins can route tickets');
        }
        if (!['OPEN', 'IN_PROGRESS', 'SOLVED'].includes(ticket.status)) {
            throw new BadRequestException(`Cannot route ticket from status ${ticket.status}`);
        }

        const assignee = await this.resolveAssignee(ticket, targetRole);
        const previousAssigneeId = ticket.assigneeId ?? null;
        const nextStatus = ticket.status === 'OPEN' ? 'IN_PROGRESS' : ticket.status;

        await (this.prisma as any).issueTicket.update({
            where: { id: ticketId },
            data: {
                status: nextStatus,
                assigneeId: assignee.id,
                confirmedAssignmentType: targetRole,
            },
        });

        await (this.prisma as any).user.update({
            where: { id: assignee.id },
            data: { lastAssignedAt: new Date() },
        });

        await this.createActivity({
            ticketId,
            actorId,
            activityType: 'TICKET_REASSIGNED',
            title: 'Ticket routed',
            message: `Routed to ${targetRole}`,
            note: reason?.trim() || null,
            meta: {
                targetRole,
                reason: reason?.trim() || null,
            },
            fromAssigneeId: previousAssigneeId,
            toAssigneeId: assignee.id,
        });

        await this.createActivity({
            ticketId,
            actorId: null,
            activityType: 'TICKET_ASSIGNED',
            title: 'Auto assigned',
            message: `System auto-assigned to ${assignee.fullName ?? assignee.email ?? assignee.id}`,
            note: null,
            meta: {
                targetRole,
                assigneeId: assignee.id,
                assigneeName: assignee.fullName ?? assignee.email ?? assignee.id,
            },
            fromAssigneeId: previousAssigneeId,
            toAssigneeId: assignee.id,
        });

        await this.notifyTicketAssigned(ticket, actor, assignee, reason?.trim() || null, targetRole);

        return this.getTicketOrThrow(ticketId);
    }

    async applyLifecycle(ticketId: string, actorId: string, action: TicketLifecycleAction, note?: string | null): Promise<TicketLike> {
        const ticket = await this.getTicketOrThrow(ticketId);
        const actor = await this.getActorOrThrow(actorId);
        const trimmedNote = note?.trim() || null;

        if (action === 'START') {
            if (!['EXAM_OFFICER', 'ADMIN', 'HALL_INVIGILATOR', 'IT_SUPPORT', 'PROCTOR'].includes(actor.role)) {
                throw new ForbiddenException('Only staff can start a ticket');
            }
            if (ticket.status !== 'OPEN') {
                throw new BadRequestException('START is only allowed from OPEN');
            }
            await (this.prisma as any).issueTicket.update({
                where: { id: ticketId },
                data: { status: 'IN_PROGRESS' },
            });
        } else if (action === 'REOPEN') {
            if (!['SOLVED', 'CLOSED'].includes(ticket.status)) {
                throw new BadRequestException('REOPEN is only allowed from SOLVED or CLOSED');
            }
            if (!(actor.id === ticket.reporterId || ['EXAM_OFFICER', 'ADMIN'].includes(actor.role))) {
                throw new ForbiddenException('Only reporter, exam officer, or admin can reopen a ticket');
            }
            await (this.prisma as any).issueTicket.update({
                where: { id: ticketId },
                data: {
                    status: 'IN_PROGRESS',
                    assigneeId: actor.id === ticket.reporterId ? ticket.assigneeId : actor.id,
                },
            });
        } else if (action === 'ACKNOWLEDGE') {
            if (ticket.status !== 'SOLVED') {
                throw new BadRequestException('ACKNOWLEDGE is only allowed from SOLVED');
            }
            if (!(actor.id === ticket.reporterId || ['EXAM_OFFICER', 'ADMIN'].includes(actor.role))) {
                throw new ForbiddenException('Only reporter, exam officer, or admin can acknowledge a ticket');
            }
            await (this.prisma as any).issueTicket.update({
                where: { id: ticketId },
                data: { status: 'CLOSED' },
            });
        } else if (action === 'CLOSE') {
            if (ticket.status !== 'SOLVED') {
                throw new BadRequestException('CLOSE is only allowed from SOLVED');
            }
            if (!['EXAM_OFFICER', 'ADMIN'].includes(actor.role)) {
                throw new ForbiddenException('Only exam officers or admins can close tickets');
            }
            await (this.prisma as any).issueTicket.update({
                where: { id: ticketId },
                data: { status: 'CLOSED' },
            });
        }

        await this.createActivity({
            ticketId,
            actorId,
            activityType: 'TICKET_COMMENTED',
            title: 'Lifecycle updated',
            message: `${actor.fullName ?? 'User'} performed ${action}`,
            note: trimmedNote,
            meta: { action, note: trimmedNote },
            fromAssigneeId: ticket.assigneeId ?? null,
            toAssigneeId: ticket.assigneeId ?? null,
        });

        return this.getTicketOrThrow(ticketId);
    }

    async setStatus(ticketId: string, actorId: string, nextStatus: TicketStatusValue, note?: string | null): Promise<TicketLike> {
        const ticket = await this.getTicketOrThrow(ticketId);
        const actor = await this.getActorOrThrow(actorId);
        const trimmedNote = note?.trim() || null;

        if (!['EXAM_OFFICER', 'ADMIN', 'HALL_INVIGILATOR', 'IT_SUPPORT', 'PROCTOR'].includes(actor.role)) {
            throw new ForbiddenException('Only staff can change ticket status');
        }

        if (ticket.status === nextStatus) {
            await this.createActivity({
                ticketId,
                actorId,
                activityType: 'TICKET_COMMENTED',
                title: 'Status unchanged',
                message: `${actor.fullName ?? 'User'} confirmed status ${nextStatus}`,
                note: trimmedNote,
                meta: {
                    fromStatus: ticket.status,
                    toStatus: nextStatus,
                    note: trimmedNote,
                },
            });
            return this.getTicketOrThrow(ticketId);
        }

        await (this.prisma as any).issueTicket.update({
            where: { id: ticketId },
            data: {
                status: nextStatus,
            },
        });

        await this.createActivity({
            ticketId,
            actorId,
            activityType:
                nextStatus === 'IN_PROGRESS'
                    ? 'TICKET_STARTED'
                    : nextStatus === 'CLOSED' || nextStatus === 'SOLVED'
                        ? 'TICKET_RESOLVED'
                        : 'TICKET_COMMENTED',
            title: 'Status updated',
            message: `${actor.fullName ?? 'User'} changed status from ${ticket.status} to ${nextStatus}`,
            note: trimmedNote,
            meta: {
                fromStatus: ticket.status,
                toStatus: nextStatus,
                note: trimmedNote,
            },
        });

        return this.getTicketOrThrow(ticketId);
    }

    async reviewAiCandidate(
        ticketId: string,
        candidateId: string,
        reviewerId: string,
        input: {
            decision: 'APPROVED' | 'REJECTED';
            finalIssueName?: string | null;
            finalIssueType?: string | null;
            resolutionCode?: string | null;
            resolutionStandardText?: string | null;
            reviewNote?: string | null;
        },
    ): Promise<TicketLike> {
        const ticket = await this.getTicketOrThrow(ticketId);
        const reviewer = await this.getActorOrThrow(reviewerId);

        if (!['EXAM_OFFICER', 'ADMIN'].includes(reviewer.role)) {
            throw new ForbiddenException('Only exam officers or admins can review AI candidates');
        }

        const candidate = await (this.prisma as any).aiCandidate.findUnique({
            where: { id: candidateId },
        });

        if (!candidate || candidate.ticketId !== ticketId) {
            throw new NotFoundException(`AI candidate ${candidateId} not found`);
        }
        if (candidate.reviewStatus !== 'PENDING_REVIEW') {
            throw new BadRequestException('AI candidate is not pending review');
        }

        if (input.decision === 'APPROVED') {
            if (!input.finalIssueName || !input.finalIssueType || !input.resolutionCode) {
                throw new BadRequestException(
                    'Approved review requires finalIssueName, finalIssueType, and resolutionCode',
                );
            }
            if (input.finalIssueName === 'OTHER' || input.resolutionCode === 'CUSTOM') {
                throw new BadRequestException('Approved AI review must map to standardized taxonomy');
            }
        }

        await (this.prisma as any).aiCandidate.update({
            where: { id: candidateId },
            data: {
                reviewStatus: input.decision,
                reviewNote: input.reviewNote?.trim() || null,
                reviewedBy: reviewerId,
                reviewedAt: new Date(),
                issueCode:
                    input.decision === 'APPROVED'
                        ? input.finalIssueName
                        : undefined,
                issueType:
                    input.decision === 'APPROVED'
                        ? input.finalIssueType
                        : undefined,
                resolutionCode:
                    input.decision === 'APPROVED'
                        ? input.resolutionCode
                        : undefined,
                responseText:
                    input.decision === 'APPROVED'
                        ? input.resolutionStandardText ?? candidate.responseText
                        : undefined,
            },
        });

        const pendingCount = await (this.prisma as any).aiCandidate.count({
            where: {
                ticketId,
                reviewStatus: 'PENDING_REVIEW',
            },
        });

        await (this.prisma as any).issueTicket.update({
            where: { id: ticketId },
            data: {
                needsAiReview: pendingCount > 0,
                reviewedBy: reviewerId,
                reviewedAt: new Date(),
                reviewNote: input.reviewNote?.trim() || null,
                aiTrainingStatus: pendingCount > 0 ? 'PENDING_REVIEW' : input.decision,
            },
        });

        await this.createActivity({
            ticketId,
            actorId: reviewerId,
            activityType: 'TICKET_COMMENTED',
            title: 'AI review',
            message: `${reviewer.fullName ?? 'Reviewer'} marked AI candidate as ${input.decision}`,
            note: input.reviewNote?.trim() || null,
            meta: {
                candidateId,
                decision: input.decision,
                finalIssueName: input.finalIssueName ?? null,
                finalIssueType: input.finalIssueType ?? null,
                resolutionCode: input.resolutionCode ?? null,
            },
        });

        return this.getTicketOrThrow(ticketId);
    }

    private assertCommentPermission(ticket: TicketLike, actor: ActorLike, mode: TicketCommentMode): void {
        if (mode === 'DISCUSSION') {
            if (
                actor.id !== ticket.reporterId &&
                !['EXAM_OFFICER', 'ADMIN', 'HALL_INVIGILATOR', 'IT_SUPPORT'].includes(actor.role)
            ) {
                throw new ForbiddenException('You do not have permission to comment on this ticket');
            }
            return;
        }

        if (!['EXAM_OFFICER', 'ADMIN', 'HALL_INVIGILATOR', 'IT_SUPPORT', 'PROCTOR'].includes(actor.role)) {
            throw new ForbiddenException('Only staff can add conclusions or resolve tickets');
        }

        if (
            ['IT_SUPPORT'].includes(actor.role) &&
            ticket.assigneeId &&
            ticket.assigneeId !== actor.id
        ) {
            throw new ForbiddenException('Only the current assignee can update this ticket');
        }
    }

    private assertCommentState(ticket: TicketLike, mode: TicketCommentMode): void {
        const allowed: Record<TicketCommentMode, string[]> = {
            DISCUSSION: ['OPEN', 'IN_PROGRESS', 'SOLVED', 'CLOSED'],
            CONCLUSION: ['OPEN', 'IN_PROGRESS', 'SOLVED', 'CLOSED'],
            RESOLUTION: ['OPEN', 'IN_PROGRESS', 'SOLVED', 'CLOSED'],
        };

        if (!allowed[mode].includes(ticket.status)) {
            throw new BadRequestException(`Comment mode ${mode} is not allowed when ticket is ${ticket.status}`);
        }
    }

    private assertStructuredPayload(mode: TicketCommentMode, payload: StructuredPayload): void {
        if (!payload.body?.trim()) {
            throw new BadRequestException('body is required');
        }

        if (mode === 'DISCUSSION') {
            return;
        }

        if (!payload.issueCode || !payload.issueType || !payload.resolutionCode) {
            throw new BadRequestException('issueCode, issueType, and resolutionCode are required');
        }
        if (payload.issueCode === 'OTHER' && !payload.issueCustomText?.trim()) {
            throw new BadRequestException('issueCustomText is required when issueCode is OTHER');
        }
        if (payload.resolutionCode === 'CUSTOM' && !payload.resolutionCustomText?.trim()) {
            throw new BadRequestException('resolutionCustomText is required when resolutionCode is CUSTOM');
        }
        if (!payload.responseText?.trim()) {
            throw new BadRequestException('responseText is required for structured comment modes');
        }
    }

    private async resolveAssignee(ticket: TicketLike, targetRole: TicketRouteRole): Promise<any> {
        const sessionCampus = ticket.session?.campus ?? null;

        if (targetRole === 'HALL_INVIGILATOR') {
            if (ticket.session?.hallInvigilatorId) {
                const direct = await (this.prisma as any).user.findUnique({
                    where: { id: ticket.session.hallInvigilatorId },
                    select: {
                        id: true,
                        fullName: true,
                        email: true,
                        role: true,
                        createdAt: true,
                        lastAssignedAt: true,
                    },
                });
                if (direct) {
                    return direct;
                }
            }
        }

        const candidates = await (this.prisma as any).user.findMany({
            where: {
                role: targetRole,
                ...(sessionCampus ? { campus: sessionCampus } : {}),
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                createdAt: true,
                lastAssignedAt: true,
                assignedTickets: {
                    where: {
                        status: { in: ['OPEN', 'IN_PROGRESS'] },
                    },
                    select: { id: true },
                },
            },
        });

        if (!candidates.length) {
            throw new BadRequestException(`No available assignee found for role ${targetRole}`);
        }

        candidates.sort((left: any, right: any) => {
            const loadDiff = left.assignedTickets.length - right.assignedTickets.length;
            if (loadDiff !== 0) return loadDiff;

            const leftLast = left.lastAssignedAt ? new Date(left.lastAssignedAt).getTime() : 0;
            const rightLast = right.lastAssignedAt ? new Date(right.lastAssignedAt).getTime() : 0;
            if (leftLast !== rightLast) return leftLast - rightLast;

            return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
        });

        return candidates[0];
    }

    private async createAiCandidate(
        ticketId: string,
        sourceActivityId: string,
        sourceType: 'CONCLUSION' | 'RESOLUTION',
        structuredMeta: Record<string, any>,
        actorId: string,
    ): Promise<'PENDING_REVIEW' | 'APPROVED'> {
        const isCustom =
            structuredMeta.issueCode === 'OTHER' || structuredMeta.resolutionCode === 'CUSTOM';
        const reviewStatus =
            sourceType === 'RESOLUTION' && !isCustom ? 'APPROVED' : 'PENDING_REVIEW';

        await (this.prisma as any).aiCandidate.create({
            data: {
                id: uuidv4(),
                ticketId,
                sourceActivityId,
                sourceType,
                issueCode: structuredMeta.issueCode ?? null,
                issueType: structuredMeta.issueType ?? null,
                issueCustomText: structuredMeta.issueCustomText ?? null,
                resolutionCode: structuredMeta.resolutionCode ?? null,
                resolutionCustomText: structuredMeta.resolutionCustomText ?? null,
                responseText: structuredMeta.responseText ?? null,
                techNote: structuredMeta.techNote ?? null,
                reviewStatus,
                reviewedBy: reviewStatus === 'APPROVED' ? actorId : null,
                reviewedAt: reviewStatus === 'APPROVED' ? new Date() : null,
                reviewNote:
                    reviewStatus === 'APPROVED'
                        ? 'Approved automatically from standardized resolution'
                        : 'Pending review',
            },
        });

        await (this.prisma as any).issueTicket.update({
            where: { id: ticketId },
            data: {
                needsAiReview: reviewStatus === 'PENDING_REVIEW',
                aiTrainingStatus: reviewStatus,
                reviewedBy: reviewStatus === 'APPROVED' ? actorId : null,
                reviewedAt: reviewStatus === 'APPROVED' ? new Date() : null,
                reviewNote:
                    reviewStatus === 'APPROVED'
                        ? 'Approved automatically from standardized resolution'
                        : 'Pending AI candidate review',
            },
        });

        return reviewStatus;
    }

    private async createActivity(input: {
        ticketId: string;
        actorId?: string | null;
        activityType: 'TICKET_ASSIGNED' | 'TICKET_REASSIGNED' | 'TICKET_COMMENTED' | 'TICKET_RESOLVED' | 'TICKET_STARTED';
        title: string;
        message: string;
        note?: string | null;
        meta?: Record<string, any>;
        fromAssigneeId?: string | null;
        toAssigneeId?: string | null;
    }): Promise<void> {
        await (this.prisma as any).activityHistory.create({
            data: {
                id: uuidv4(),
                ticketId: input.ticketId,
                studentExamId: null,
                activityType: input.activityType,
                description: JSON.stringify({
                    event: input.activityType,
                    title: input.title,
                    message: input.message,
                    meta: input.meta ?? {},
                }),
                actorId: input.actorId ?? null,
                fromAssigneeId: input.fromAssigneeId ?? null,
                toAssigneeId: input.toAssigneeId ?? null,
                note: input.note ?? null,
            },
        });
    }

    private safeParse(raw: string): Record<string, any> | null {
        try {
            const parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : null;
        } catch {
            return null;
        }
    }

    private async notifyTicketAssigned(
        ticket: TicketLike,
        actor: ActorLike,
        assignee: any,
        reason: string | null,
        targetRole: TicketRouteRole,
    ): Promise<void> {
        await (this.prisma as any).notification.create({
            data: {
                id: uuidv4(),
                toUserId: assignee.id,
                fromId: actor.id,
                title: `Ticket assigned: ${ticket.issueName}`,
                message: reason || `Ticket routed to ${targetRole}`,
                channel: 'IN_APP',
                meta: { ticketId: ticket.id, targetRole, reason },
            },
        });

        this.notificationGateway.sendToUser(assignee.id, 'ticket:assigned', {
            ticketId: ticket.id,
            assigneeId: assignee.id,
            issueName: ticket.issueName,
            actorName: actor.fullName ?? 'Staff',
            reporterId: ticket.reporterId,
            targetRole,
            reason,
            isUserNotification: true,
        });
    }
}
