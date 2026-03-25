import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@app/prisma';
import { TICKET_REPOSITORY, ITicketRepository } from '@app/tickets';
import { CreateTicketDto } from './create-ticket.dto';
import { NotificationGateway } from '../../../../common/gateways/notification.gateway';
import { logSessionActivity } from '../../../../common/utils/activity-history.util';

@Injectable()
export class CreateTicketHandler {
    constructor(
        @Inject(TICKET_REPOSITORY)
        private readonly ticketRepository: ITicketRepository,
        private readonly prisma: PrismaService,
        private readonly notificationGateway: NotificationGateway,
    ) { }

    async execute(dto: CreateTicketDto, reporterId: string): Promise<any> {
        // Helper: parse DB time strings as Vietnam local time (UTC+7)
        // DB stores "2026-03-12 08:30:00.000" (no Z) — Node.js treats this as UTC
        // which would be wrong. We append +07:00 so JS parses it as Vietnam time.
        // DB stores Vietnam local time (UTC+7) as naive timestamps.
        // Prisma reads naive timestamps and returns Date objects assuming UTC.
        // e.g. "2026-03-12 08:30:00" → Prisma Date of UTC 08:30 (= VN 15:30, WRONG)
        // Fix: take the ISO string, strip the Z, re-add +07:00 to reinterpret as VN time.
        const toVNDate = (s: string | Date | null): Date | null => {
            if (!s) return null;
            // Get a plain date-time string without any timezone info
            let raw: string;
            if (s instanceof Date) {
                // "2026-03-12T08:30:00.000Z" → strip Z → "2026-03-12T08:30:00.000"
                raw = s.toISOString().replace('Z', '');
            } else {
                raw = String(s).replace(/Z$/, '').replace(/[+-]\d{2}:?\d{2}$/, '').replace(' ', 'T');
            }
            // Re-parse treating those digits as Vietnam local time
            const d = new Date(`${raw}+07:00`);
            return isNaN(d.getTime()) ? null : d;
        };

        // 0. Validate session status: only Ongoing or within 30min grace period
        if (!dto.sessionId) {
            throw new BadRequestException('sessionId is required to create a ticket');
        }

        const session = await this.prisma.examSession.findUnique({
            where: { id: dto.sessionId },
            select: { examOpenTime: true, examCloseTime: true, campus: true },
        });

        if (!session) {
            throw new BadRequestException(`Exam session ${dto.sessionId} not found`);
        }

        const now = new Date();
        const openTime = toVNDate(session.examOpenTime as any);
        const closeTime = toVNDate(session.examCloseTime as any);

        if (!openTime || !closeTime) {
            throw new BadRequestException('Exam session does not have valid open/close times');
        }

        const PRE_EXAM_MS = 15 * 60 * 1000;    // 15 min before start
        const GRACE_PERIOD_MS = 30 * 60 * 1000; // 30 min after end

        // Allow: [openTime - 15min] → [closeTime + 30min]
        if (now < new Date(openTime.getTime() - PRE_EXAM_MS)) {
            throw new BadRequestException('Cannot create ticket: exam session starts in more than 15 minutes');
        }

        if (now > new Date(closeTime.getTime() + GRACE_PERIOD_MS)) {
            throw new BadRequestException('Cannot create ticket: exam session ended more than 30 minutes ago');
        }

        // 1. Create the ticket
        const ticket = await this.ticketRepository.save({
            id: undefined,
            issueName: dto.issueName,
            issueType: dto.issueType,
            description: dto.description,
            priority: dto.priority ?? 'Medium',
            status: 'OPEN',
            reporterId,
            sessionId: dto.sessionId,
            attachment: dto.attachment,
            studentCode: dto.studentCode,
        });


        // 2. Fetch reporter info
        const reporter = await this.prisma.user.findUnique({
            where: { id: reporterId },
            select: { fullName: true, role: true },
        });

        // 3. Emit real-time WebSocket event → only to exam officers on the same campus
        //    Fallback to sendToAll when session has no campus (backward-compatible)
        const sessionCampus = session?.campus;
        if (sessionCampus) {
            this.notificationGateway.sendToCampus(sessionCampus, 'ticket:created', {
                ticket,
                reporter: reporter ?? null,
            });
        } else {
            this.notificationGateway.sendToAll('ticket:created', {
                ticket,
                reporter: reporter ?? null,
            });
        }

        // 4. Fetch Exam Officers — filtered by campus when available
        const examOfficers = await this.prisma.user.findMany({
            where: {
                role: 'EXAM_OFFICER',
                // Only notify exam officers at the same campus; if campus unknown → notify all
                ...(sessionCampus ? { campus: sessionCampus } : {}),
            },
            select: { id: true },
        });

        // 5. Emit real-time WebSocket event directly to each Exam Officer's personal room
        //    This is more reliable than campus-room broadcast because it doesn't depend on
        //    the client having joined the campus room.
        const notifyPayload = { ticket, reporter: reporter ?? null };
        for (const eo of examOfficers) {
            this.notificationGateway.sendToUser(eo.id, 'ticket:created', notifyPayload);
        }

        // 6. Create in-app notifications for each Exam Officer
        if (examOfficers.length > 0) {
            await this.prisma.notification.createMany({
                data: examOfficers.map(eo => ({
                    id: uuidv4(),
                    toUserId: eo.id,
                    fromId: reporterId,
                    title: `🎫 Ticket mới: ${dto.issueName}`,
                    message: `${reporter?.fullName ?? 'Giám thị'} vừa tạo ticket mới: "${dto.issueName}". Độ ưu tiên: ${dto.priority ?? 'Medium'}.`,
                    channel: 'IN_APP',
                    meta: { ticketId: ticket.id, issueType: dto.issueType },
                })),
            });
        }

        await logSessionActivity(this.prisma, {
            sessionId: dto.sessionId,
            ticketId: ticket.id,
            activityType: 'MOVED',
            payload: {
                event: 'TICKET_CREATED',
                title: 'Ticket Created',
                message: `${reporter?.fullName ?? 'Staff'} created ticket ${ticket.issueName}`,
                meta: {
                    ticketId: ticket.id,
                    issueName: ticket.issueName,
                    issueType: ticket.issueType,
                    priority: ticket.priority,
                    reporterName: reporter?.fullName ?? null,
                },
            },
        });

        return ticket;
    }
}
