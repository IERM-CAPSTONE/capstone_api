import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@app/prisma';
import { TICKET_REPOSITORY, ITicketRepository } from '@app/tickets';
import { ProcessTicketDto, ProcessAction } from './process-ticket.dto';
import { NotificationGateway } from '../../../../common/gateways/notification.gateway';

@Injectable()
export class ProcessTicketHandler {
    constructor(
        @Inject(TICKET_REPOSITORY)
        private readonly ticketRepository: ITicketRepository,
        private readonly prisma: PrismaService,
        private readonly notificationGateway: NotificationGateway,
    ) { }

    async execute(ticketId: string, dto: ProcessTicketDto, officerId: string): Promise<any> {
        // 1. Fetch the ticket
        const ticket = await this.ticketRepository.findById(ticketId);
        if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);

        if (dto.action === ProcessAction.ASSIGN && !dto.assigneeId) {
            throw new BadRequestException('assigneeId is required when action is "assign"');
        }

        // 1.5 Validate session status: only Ongoing or within 30min grace period
        if ((ticket as any).sessionId) {
            const session = await this.prisma.examSession.findUnique({
                where: { id: (ticket as any).sessionId },
                select: { examOpenTime: true, examCloseTime: true },
            });

            if (session?.examCloseTime) {
                // DB stores Vietnam local time (UTC+7) as naive timestamps.
                // Prisma reads naive timestamps as UTC Date objects — reinterpret as VN time.
                const toVNDate = (s: any): Date | null => {
                    if (!s) return null;
                    const raw = s instanceof Date
                        ? s.toISOString().replace('Z', '')
                        : String(s).replace(/Z$/, '').replace(/[+-]\d{2}:?\d{2}$/, '').replace(' ', 'T');
                    const d = new Date(`${raw}+07:00`);
                    return isNaN(d.getTime()) ? null : d;
                };
                const now = new Date();
                const closeTime = toVNDate(session.examCloseTime);
                const GRACE_PERIOD_MS = 30 * 60 * 1000; // 30 minutes
                if (closeTime && now > new Date(closeTime.getTime() + GRACE_PERIOD_MS)) {
                    throw new BadRequestException('Cannot process ticket: exam session ended more than 30 minutes ago');
                }
            }
        }


        // 2. Update the ticket
        const newStatus = dto.action === ProcessAction.RESOLVE ? 'SOLVED' : 'IN_PROGRESS';
        const updatedTicket = await this.ticketRepository.save({
            id: ticketId,
            status: newStatus,
            resolveNote: dto.resolveNote,
            assigneeId: dto.action === ProcessAction.ASSIGN ? dto.assigneeId : undefined,
        });

        const officer = await this.prisma.user.findUnique({
            where: { id: officerId },
            select: { fullName: true },
        });
        const officerName = officer?.fullName ?? 'Exam Officer';

        // 3. Send notifications based on action
        if (dto.action === ProcessAction.RESOLVE) {
            // Notify the reporter
            await this.prisma.notification.create({
                data: {
                    id: uuidv4(),
                    toUserId: ticket.reporterId,
                    fromId: officerId,
                    title: `✅ Ticket Resolved: ${ticket.issueName}`,
                    message: `Your ticket has been resolved by ${officerName}. Note: ${dto.resolveNote}`,
                    channel: 'IN_APP',
                    meta: { ticketId, resolveNote: dto.resolveNote },
                },
            });

            // Emit real-time to reporter
            this.notificationGateway.sendToAll('ticket:resolved', {
                ticketId,
                issueName: ticket.issueName,
                studentCode: (ticket as any).studentCode ?? null,
                resolveNote: dto.resolveNote,
                officerName,
                reporterId: ticket.reporterId,
            });
        } else {
            // Notify the assignee (DB)
            await this.prisma.notification.create({
                data: {
                    id: uuidv4(),
                    toUserId: dto.assigneeId!,
                    fromId: officerId,
                    title: `📋 Ticket Assigned to You: ${ticket.issueName}`,
                    message: `${officerName} assigned you a ticket. Note: ${dto.resolveNote}`,
                    channel: 'IN_APP',
                    meta: { ticketId, note: dto.resolveNote },
                },
            });

            // Emit real-time socket event - broadcast, client filters by assigneeId
            this.notificationGateway.sendToAll('ticket:assigned', {
                ticketId,
                assigneeId: dto.assigneeId!,
                issueName: ticket.issueName,
                studentCode: (ticket as any).studentCode ?? null,
                officerName,
                reporterId: ticket.reporterId,
            });
        }

        return updatedTicket;
    }
}
