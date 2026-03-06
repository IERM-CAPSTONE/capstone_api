import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@app/prisma';
import { TICKET_REPOSITORY, ITicketRepository } from '@app/tickets';
import { ProcessTicketDto, ProcessAction } from './process-ticket.dto';

@Injectable()
export class ProcessTicketHandler {
    constructor(
        @Inject(TICKET_REPOSITORY)
        private readonly ticketRepository: ITicketRepository,
        private readonly prisma: PrismaService,
    ) { }

    async execute(ticketId: string, dto: ProcessTicketDto, officerId: string): Promise<any> {
        // 1. Fetch the ticket
        const ticket = await this.ticketRepository.findById(ticketId);
        if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);

        if (dto.action === ProcessAction.ASSIGN && !dto.assigneeId) {
            throw new BadRequestException('assigneeId is required when action is "assign"');
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

        // 3. Send notifications based on action
        if (dto.action === ProcessAction.RESOLVE) {
            // Notify the reporter
            await this.prisma.notification.create({
                data: {
                    id: uuidv4(),
                    toUserId: ticket.reporterId,
                    fromId: officerId,
                    title: `✅ Ticket Resolved: ${ticket.issueName}`,
                    message: `Your ticket has been resolved by ${officer?.fullName ?? 'Exam Officer'}. Note: ${dto.resolveNote}`,
                    channel: 'IN_APP',
                    meta: { ticketId, resolveNote: dto.resolveNote },
                },
            });
        } else {
            // Notify the assignee
            await this.prisma.notification.create({
                data: {
                    id: uuidv4(),
                    toUserId: dto.assigneeId!,
                    fromId: officerId,
                    title: `📋 Ticket Assigned to You: ${ticket.issueName}`,
                    message: `${officer?.fullName ?? 'Exam Officer'} assigned you a ticket. Note: ${dto.resolveNote}`,
                    channel: 'IN_APP',
                    meta: { ticketId, note: dto.resolveNote },
                },
            });
        }

        return updatedTicket;
    }
}
