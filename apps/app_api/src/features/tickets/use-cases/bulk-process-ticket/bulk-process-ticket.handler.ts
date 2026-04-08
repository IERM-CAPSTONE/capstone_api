import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@app/prisma';
import { TICKET_REPOSITORY, ITicketRepository } from '@app/tickets';
import { BulkProcessTicketDto, BulkProcessAction } from './bulk-process-ticket.dto';
import { NotificationGateway } from '../../../../common/gateways/notification.gateway';
import { logSessionActivity } from '../../../../common/utils/activity-history.util';
import { FcmService } from '../../../../common/fcm/fcm.service';

export interface BulkProcessResult {
    processed: number;
    failed: number;
    details: { ticketId: string; success: boolean; error?: string }[];
}

@Injectable()
export class BulkProcessTicketHandler {
    constructor(
        @Inject(TICKET_REPOSITORY)
        private readonly ticketRepository: ITicketRepository,
        private readonly prisma: PrismaService,
        private readonly notificationGateway: NotificationGateway,
        private readonly fcmService: FcmService,
    ) { }

    async execute(dto: BulkProcessTicketDto, officerId: string): Promise<BulkProcessResult> {
        if (dto.action === BulkProcessAction.ASSIGN && !dto.assigneeId) {
            throw new BadRequestException('assigneeId is required when action is "assign"');
        }
        if (dto.action === BulkProcessAction.CHANGE_STATUS && !dto.status) {
            throw new BadRequestException('status is required when action is "change_status"');
        }

        const officer = await this.prisma.user.findUnique({
            where: { id: officerId },
            select: { fullName: true },
        });

        const nextStatus =
            dto.action === BulkProcessAction.ASSIGN
                ? 'IN_PROGRESS'
                : dto.action === BulkProcessAction.RESOLVE
                    ? 'SOLVED'
                    : dto.status!;
        const note = (dto.note ?? dto.resolveNote ?? '').trim();
        const officerName = officer?.fullName ?? 'Exam Officer';
        const details: BulkProcessResult['details'] = [];

        await Promise.all(
            dto.ticketIds.map(async (ticketId) => {
                try {
                    const ticket = await this.ticketRepository.findById(ticketId);
                    if (!ticket) {
                        details.push({ ticketId, success: false, error: 'Not found' });
                        return;
                    }

                    await this.ticketRepository.save({
                        id: ticketId,
                        status: nextStatus,
                        assigneeId: dto.action === BulkProcessAction.ASSIGN ? dto.assigneeId : undefined,
                        resolveNote:
                            (dto.action === BulkProcessAction.CHANGE_STATUS || dto.action === BulkProcessAction.RESOLVE) && nextStatus === 'SOLVED'
                                ? (note || ticket.resolveNote || null)
                                : undefined,
                    });

                    if ((ticket as any).session?.campus) {
                        this.notificationGateway.sendToCampus((ticket as any).session.campus, 'monitor:ticket_count_changed', {
                            ticketId,
                            sessionId: (ticket as any).sessionId ?? null,
                            campus: (ticket as any).session.campus,
                            action: dto.action,
                            status: nextStatus,
                            bulk: true,
                        });
                    } else {
                        this.notificationGateway.sendToAll('monitor:ticket_count_changed', {
                            ticketId,
                            sessionId: (ticket as any).sessionId ?? null,
                            action: dto.action,
                            status: nextStatus,
                            bulk: true,
                        });
                    }

                    if ((dto.action === BulkProcessAction.CHANGE_STATUS || dto.action === BulkProcessAction.RESOLVE) && nextStatus === 'SOLVED') {
                        await this.prisma.notification.create({
                            data: {
                                id: uuidv4(),
                                toUserId: ticket.reporterId,
                                fromId: officerId,
                                title: `Ticket resolved: ${ticket.issueName}`,
                                message: note
                                    ? `${officerName} resolved the ticket. ${note}`
                                    : `${officerName} resolved the ticket.`,
                                channel: 'IN_APP',
                                meta: { ticketId, resolveNote: note, bulk: true },
                            },
                        });

                        this.notificationGateway.sendToUser(ticket.reporterId, 'ticket:resolved', {
                            ticketId,
                            issueName: ticket.issueName,
                            studentCode: (ticket as any).studentCode ?? null,
                            resolveNote: note,
                            officerName,
                            reporterId: ticket.reporterId,
                            isUserNotification: true,
                        });

                        await this.fcmService.sendToUser(ticket.reporterId, {
                            title: `Ticket resolved: ${ticket.issueName}`,
                            body: note
                                ? `${officerName} resolved the ticket. ${note}`
                                : `${officerName} resolved the ticket.`,
                            data: {
                                type: 'ticket_resolved',
                                ticketId,
                                issueName: ticket.issueName,
                                studentCode: (ticket as any).studentCode ?? '',
                                reporterId: ticket.reporterId,
                                actorName: officerName,
                            },
                        });
                    } else if (dto.action === BulkProcessAction.ASSIGN && dto.assigneeId) {
                        await this.prisma.notification.create({
                            data: {
                                id: uuidv4(),
                                toUserId: dto.assigneeId,
                                fromId: officerId,
                                title: `Ticket assigned: ${ticket.issueName}`,
                                message: note
                                    ? `${officerName} assigned a ticket to you. ${note}`
                                    : `${officerName} assigned a ticket to you.`,
                                channel: 'IN_APP',
                                meta: { ticketId, note, bulk: true },
                            },
                        });

                        this.notificationGateway.sendToUser(dto.assigneeId, 'ticket:assigned', {
                            ticketId,
                            assigneeId: dto.assigneeId,
                            issueName: ticket.issueName,
                            studentCode: (ticket as any).studentCode ?? null,
                            officerName,
                            reporterId: ticket.reporterId,
                            isUserNotification: true,
                        });

                        await this.fcmService.sendToUser(dto.assigneeId, {
                            title: `Ticket assigned: ${ticket.issueName}`,
                            body: note
                                ? `${officerName} assigned a ticket to you. ${note}`
                                : `${officerName} assigned a ticket to you.`,
                            data: {
                                type: 'ticket_assigned',
                                ticketId,
                                assigneeId: dto.assigneeId,
                                issueName: ticket.issueName,
                                studentCode: (ticket as any).studentCode ?? '',
                                reporterId: ticket.reporterId,
                                actorName: officerName,
                            },
                        });
                    }

                    if ((ticket as any).sessionId) {
                        await logSessionActivity(this.prisma, {
                            sessionId: (ticket as any).sessionId,
                            ticketId,
                            activityType: 'MOVED',
                            payload: {
                                event: dto.action === BulkProcessAction.ASSIGN ? 'TICKET_ASSIGNED' : 'TICKET_STATUS_CHANGED',
                                title: 'Ticket Processed (Bulk)',
                                message: `${officerName} processed ticket ${ticket.issueName} in bulk mode`,
                                meta: {
                                    ticketId,
                                    action: dto.action,
                                    assigneeId: dto.assigneeId ?? null,
                                    status: dto.status ?? null,
                                    note,
                                },
                            },
                        });
                    }

                    details.push({ ticketId, success: true });
                } catch (err: any) {
                    details.push({ ticketId, success: false, error: err?.message });
                }
            }),
        );

        return {
            processed: details.filter((d) => d.success).length,
            failed: details.filter((d) => !d.success).length,
            details,
        };
    }
}
