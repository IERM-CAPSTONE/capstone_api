import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@app/prisma';
import { TICKET_REPOSITORY, ITicketRepository } from '@app/tickets';
import { BulkProcessTicketDto, BulkProcessAction } from './bulk-process-ticket.dto';
import { NotificationGateway } from '../../../../common/gateways/notification.gateway';

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
    ) { }

    async execute(dto: BulkProcessTicketDto, officerId: string): Promise<BulkProcessResult> {
        const officer = await this.prisma.user.findUnique({
            where: { id: officerId },
            select: { fullName: true },
        });

        const newStatus = dto.action === BulkProcessAction.RESOLVE ? 'SOLVED' : 'IN_PROGRESS';
        const officerName = officer?.fullName ?? 'Exam Officer';

        const details: BulkProcessResult['details'] = [];

        // Process each ticket individually so failures don't block the rest
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
                        status: newStatus,
                        resolveNote: dto.resolveNote,
                        assigneeId: dto.action === BulkProcessAction.ASSIGN ? dto.assigneeId : undefined,
                    });

                    // Notify the specific reporter (individual notification per ticket)
                    if (dto.action === BulkProcessAction.RESOLVE) {
                        await this.prisma.notification.create({
                            data: {
                                id: uuidv4(),
                                toUserId: ticket.reporterId,
                                fromId: officerId,
                                title: `✅ Ticket đã được xử lý: ${ticket.issueName}`,
                                message: `Ticket của bạn đã được xử lý bởi ${officerName}. Ghi chú: ${dto.resolveNote}`,
                                channel: 'IN_APP',
                                meta: { ticketId, resolveNote: dto.resolveNote, bulk: true },
                            },
                        });

                        // Emit real-time WebSocket event to the reporter (proctor)
                        this.notificationGateway.sendToAll('ticket:resolved', {
                            ticketId,
                            issueName: ticket.issueName,
                            studentCode: (ticket as any).studentCode ?? null,
                            resolveNote: dto.resolveNote,
                            officerName,
                            reporterId: ticket.reporterId,
                        });
                    } else if (dto.assigneeId) {
                        await this.prisma.notification.create({
                            data: {
                                id: uuidv4(),
                                toUserId: dto.assigneeId,
                                fromId: officerId,
                                title: `📋 Ticket được giao: ${ticket.issueName}`,
                                message: `${officerName} đã giao ticket cho bạn. Ghi chú: ${dto.resolveNote}`,
                                channel: 'IN_APP',
                                meta: { ticketId, note: dto.resolveNote, bulk: true },
                            },
                        });

                        // Emit real-time socket event - broadcast, client filters by assigneeId
                        this.notificationGateway.sendToAll('ticket:assigned', {
                            ticketId,
                            assigneeId: dto.assigneeId,
                            issueName: ticket.issueName,
                            studentCode: (ticket as any).studentCode ?? null,
                            officerName,
                            reporterId: ticket.reporterId,
                        });
                    }

                    details.push({ ticketId, success: true });
                } catch (err) {
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
