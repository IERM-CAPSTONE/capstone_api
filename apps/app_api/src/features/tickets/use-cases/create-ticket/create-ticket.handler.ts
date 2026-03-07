import { Injectable, Inject } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@app/prisma';
import { TICKET_REPOSITORY, ITicketRepository } from '@app/tickets';
import { CreateTicketDto } from './create-ticket.dto';
import { NotificationGateway } from '../../../../common/gateways/notification.gateway';

@Injectable()
export class CreateTicketHandler {
    constructor(
        @Inject(TICKET_REPOSITORY)
        private readonly ticketRepository: ITicketRepository,
        private readonly prisma: PrismaService,
        private readonly notificationGateway: NotificationGateway,
    ) { }

    async execute(dto: CreateTicketDto, reporterId: string): Promise<any> {
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

        // 3. Emit real-time WebSocket event → exam officer ticket page updates instantly
        this.notificationGateway.sendToAll('ticket:created', {
            ticket,
            reporter: reporter ?? null,
        });

        // 4. Fetch all Exam Officers for in-app notification
        const examOfficers = await this.prisma.user.findMany({
            where: { role: 'EXAM_OFFICER' },
            select: { id: true },
        });

        // 5. Create in-app notifications for each Exam Officer
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

        return ticket;
    }
}
