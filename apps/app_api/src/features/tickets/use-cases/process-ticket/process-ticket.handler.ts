import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@app/prisma';
import { TICKET_REPOSITORY, ITicketRepository } from '@app/tickets';
import { ProcessTicketDto, ProcessAction } from './process-ticket.dto';
import { NotificationGateway } from '../../../../common/gateways/notification.gateway';
import { FcmService } from '../../../../common/fcm/fcm.service';

@Injectable()
export class ProcessTicketHandler {
    constructor(
        @Inject(TICKET_REPOSITORY)
        private readonly ticketRepository: ITicketRepository,
        private readonly prisma: PrismaService,
        private readonly notificationGateway: NotificationGateway,
        private readonly fcmService: FcmService,
    ) { }

    async execute(ticketId: string, dto: ProcessTicketDto, actorId: string): Promise<any> {
        const ticket = await this.ticketRepository.findById(ticketId);
        if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);

        const note = (dto.note ?? dto.resolveNote ?? '').trim();
        const isAssignAction =
            dto.action === ProcessAction.ASSIGN || dto.action === ProcessAction.REASSIGN;
        const isStatusChangeAction =
            dto.action === ProcessAction.CHANGE_STATUS ||
            dto.action === ProcessAction.RESOLVE ||
            dto.action === ProcessAction.START;
        const requestedStatus =
            dto.action === ProcessAction.RESOLVE
                ? 'SOLVED'
                : dto.action === ProcessAction.START
                    ? 'IN_PROGRESS'
                    : dto.status;

        const actor = await this.prisma.user.findUnique({
            where: { id: actorId },
            select: { fullName: true, role: true },
        });
        if (!actor) {
            throw new NotFoundException(`Actor ${actorId} not found`);
        }
        const actorRole = actor.role;

        if (isAssignAction && !dto.assigneeId) {
            throw new BadRequestException('assigneeId is required when action is "assign" or "reassign"');
        }
        if (isAssignAction && !note) {
            throw new BadRequestException('note is required when assigning or reassigning a ticket');
        }
        if (isAssignAction && !['HALL_INVIGILATOR', 'EXAM_OFFICER'].includes(actorRole)) {
            throw new ForbiddenException('Only hall invigilators or exam officers can assign or reassign tickets');
        }

        if (isStatusChangeAction) {
            const canChangeStatusRole =
                actorRole === 'IT_SUPPORT' ||
                actorRole === 'EXAM_OFFICER' ||
                actorRole === 'HALL_INVIGILATOR';
            if (!canChangeStatusRole) {
                throw new ForbiddenException('Only IT support, exam officers, or hall invigilators can change ticket status');
            }
            if (!requestedStatus) {
                throw new BadRequestException('status is required when action is "change_status"');
            }
            const canBypassAssignee = actorRole === 'EXAM_OFFICER' || actorRole === 'HALL_INVIGILATOR';
            if (!canBypassAssignee && ticket.assigneeId && ticket.assigneeId !== actorId) {
                throw new ForbiddenException('Only the current assignee can change this ticket status');
            }
            if (requestedStatus === 'SOLVED' && dto.finalIssueName === 'OTHER' && !(dto.finalIssueCustomText ?? '').trim()) {
                throw new BadRequestException('finalIssueCustomText is required when finalIssueName is "OTHER"');
            }
            if (requestedStatus === 'SOLVED' && dto.resolutionCode === 'CUSTOM' && !(dto.resolutionCustomText ?? '').trim()) {
                throw new BadRequestException('resolutionCustomText is required when resolutionCode is "CUSTOM"');
            }
        }

        const isCustomIssue =
            isStatusChangeAction && requestedStatus === 'SOLVED' && dto.finalIssueName === 'OTHER';
        const isCustomResolution =
            isStatusChangeAction && requestedStatus === 'SOLVED' && dto.resolutionCode === 'CUSTOM';
        const requiresAiReview = isCustomIssue || isCustomResolution;

        const nextStatus =
            isAssignAction
                ? 'IN_PROGRESS'
                : isStatusChangeAction
                    ? requestedStatus!
                    : ticket.status;

        const updatedTicket = await this.ticketRepository.save({
            id: ticketId,
            status: nextStatus,
            assigneeId: isAssignAction ? dto.assigneeId : undefined,
            resolveNote:
                isStatusChangeAction && requestedStatus === 'SOLVED'
                    ? (note || ticket.resolveNote || null)
                    : undefined,
            techNote:
                isStatusChangeAction &&
                requestedStatus === 'SOLVED' &&
                actorId === ticket.assigneeId
                    ? note
                    : undefined,
            finalIssueName:
                isStatusChangeAction && requestedStatus === 'SOLVED'
                    ? dto.finalIssueName ?? ticket.issueName
                    : undefined,
            finalIssueType:
                isStatusChangeAction && requestedStatus === 'SOLVED'
                    ? dto.finalIssueType ?? ticket.issueType
                    : undefined,
            finalIssueCustomText:
                isStatusChangeAction && requestedStatus === 'SOLVED'
                    ? isCustomIssue
                        ? (dto.finalIssueCustomText ?? '').trim() || null
                        : null
                    : undefined,
            resolutionCode:
                isStatusChangeAction && requestedStatus === 'SOLVED'
                    ? dto.resolutionCode ?? null
                    : undefined,
            resolutionCustomText:
                isStatusChangeAction && requestedStatus === 'SOLVED'
                    ? isCustomResolution
                        ? (dto.resolutionCustomText ?? '').trim() || null
                        : null
                    : undefined,
            resolutionStandardText:
                isStatusChangeAction && requestedStatus === 'SOLVED'
                    ? isCustomResolution
                        ? null
                        : dto.resolutionStandardText ?? null
                    : undefined,
            needsAiReview:
                isStatusChangeAction && requestedStatus === 'SOLVED'
                    ? requiresAiReview
                    : undefined,
            aiTrainingStatus:
                isStatusChangeAction && requestedStatus === 'SOLVED'
                    ? requiresAiReview
                        ? 'PENDING_REVIEW'
                        : 'APPROVED'
                    : undefined,
            reviewedBy:
                isStatusChangeAction && requestedStatus === 'SOLVED'
                    ? requiresAiReview
                        ? null
                        : actorId
                    : undefined,
            reviewedAt:
                isStatusChangeAction && requestedStatus === 'SOLVED'
                    ? requiresAiReview
                        ? null
                        : new Date()
                    : undefined,
            reviewNote:
                isStatusChangeAction && requestedStatus === 'SOLVED'
                    ? requiresAiReview
                        ? 'Pending AI review because custom taxonomy was used.'
                        : 'Approved automatically from standardized taxonomy.'
                    : undefined,
        });

        const actorName = actor?.fullName ?? 'Staff';
        const previousAssigneeId = ticket.assigneeId ?? null;

        const historyType =
            dto.action === ProcessAction.ASSIGN
                ? 'TICKET_ASSIGNED'
                : dto.action === ProcessAction.REASSIGN
                    ? 'TICKET_REASSIGNED'
                    : 'TICKET_COMMENTED';

        await this.prisma.activityHistory.create({
            data: {
                id: uuidv4(),
                ticketId,
                studentExamId: null,
                activityType: historyType as any,
                description: JSON.stringify({
                    event: historyType,
                    title: 'Ticket Workflow',
                    message: `${actorName} performed ${dto.action} on ticket ${ticket.issueName}`,
                    meta: {
                        ticketId,
                        action: dto.action,
                        status: isStatusChangeAction ? requestedStatus ?? null : null,
                        actorName,
                        resolutionCode: dto.resolutionCode ?? null,
                        aiTrainingStatus:
                            isStatusChangeAction && dto.status === 'SOLVED'
                                ? requiresAiReview
                                    ? 'PENDING_REVIEW'
                                    : 'APPROVED'
                                : null,
                        fromAssigneeId: previousAssigneeId,
                        toAssigneeId: isAssignAction ? dto.assigneeId : ticket.assigneeId ?? null,
                    },
                }),
                actorId,
                fromAssigneeId: previousAssigneeId,
                toAssigneeId: isAssignAction ? dto.assigneeId : ticket.assigneeId ?? null,
                note: note || null,
            } as any,
        });

        if (isStatusChangeAction && requestedStatus === 'SOLVED') {
            await this.prisma.notification.create({
                data: {
                    id: uuidv4(),
                    toUserId: ticket.reporterId,
                    fromId: actorId,
                    title: `Ticket resolved: ${ticket.issueName}`,
                    message: `${actorName} resolved the ticket. Note: ${note}`,
                    channel: 'IN_APP',
                    meta: { ticketId, resolveNote: note },
                },
            });

            this.notificationGateway.sendToUser(ticket.reporterId, 'ticket:resolved', {
                ticketId,
                issueName: ticket.issueName,
                studentCode: (ticket as any).studentCode ?? null,
                resolveNote: note,
                actorName,
                reporterId: ticket.reporterId,
                isUserNotification: true,
            });

            await this.fcmService.sendToUser(ticket.reporterId, {
                title: `Ticket resolved: ${ticket.issueName}`,
                body: note
                    ? `${actorName} resolved the ticket. ${note}`
                    : `${actorName} resolved the ticket.`,
                data: {
                    type: 'ticket_resolved',
                    ticketId,
                    issueName: ticket.issueName,
                    studentCode: (ticket as any).studentCode ?? '',
                    reporterId: ticket.reporterId,
                    actorId,
                    actorName,
                },
            });
        }

        const monitorPayload = {
            ticketId,
            sessionId: (ticket as any).sessionId ?? null,
            campus: (ticket as any).session?.campus ?? null,
            action: dto.action,
            status: updatedTicket.status,
        };
        if ((ticket as any).session?.campus) {
            this.notificationGateway.sendToCampus((ticket as any).session.campus, 'monitor:ticket_count_changed', monitorPayload);
        } else {
            this.notificationGateway.sendToAll('monitor:ticket_count_changed', monitorPayload);
        }

        if (isStatusChangeAction) {
            this.notificationGateway.sendToUser(actorId, 'ticket:updated', {
                ticketId,
                status: updatedTicket.status,
                actorName,
                isUserNotification: false,
            });
            if (ticket.reporterId) {
                this.notificationGateway.sendToUser(ticket.reporterId, 'ticket:updated', {
                    ticketId,
                    status: updatedTicket.status,
                    actorName,
                    issueName: ticket.issueName,
                    studentCode: (ticket as any).studentCode ?? null,
                    isUserNotification: false,
                });
            }
        }

        if (isAssignAction && dto.assigneeId) {
            await this.prisma.notification.create({
                data: {
                    id: uuidv4(),
                    toUserId: dto.assigneeId,
                    fromId: actorId,
                    title: `Ticket assigned: ${ticket.issueName}`,
                    message: `${actorName} assigned you a ticket. Note: ${note}`,
                    channel: 'IN_APP',
                    meta: { ticketId, note, action: dto.action },
                },
            });

            this.notificationGateway.sendToUser(dto.assigneeId, 'ticket:assigned', {
                ticketId,
                assigneeId: dto.assigneeId,
                issueName: ticket.issueName,
                studentCode: (ticket as any).studentCode ?? null,
                actorName,
                reporterId: ticket.reporterId,
                note,
                action: dto.action,
                isUserNotification: true,
            });

            await this.fcmService.sendToUser(dto.assigneeId, {
                title:
                    dto.action === ProcessAction.REASSIGN
                        ? `Ticket reassigned: ${ticket.issueName}`
                        : `Ticket assigned: ${ticket.issueName}`,
                body: note
                    ? `${actorName} assigned you a ticket. ${note}`
                    : `${actorName} assigned you a ticket.`,
                data: {
                    type: dto.action === ProcessAction.REASSIGN ? 'ticket_reassigned' : 'ticket_assigned',
                    ticketId,
                    assigneeId: dto.assigneeId,
                    issueName: ticket.issueName,
                    studentCode: (ticket as any).studentCode ?? '',
                    reporterId: ticket.reporterId,
                    actorId,
                    actorName,
                    action: dto.action,
                },
            });
        }

        return updatedTicket;
    }
}
