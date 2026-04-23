import { Injectable, Inject } from '@nestjs/common';
import { TICKET_REPOSITORY, ITicketRepository } from '@app/tickets';

@Injectable()
export class ListTicketsHandler {
    constructor(
        @Inject(TICKET_REPOSITORY)
        private readonly ticketRepository: ITicketRepository,
    ) { }

    async execute(filters: {
        status?: string;
        reporterId?: string;
        assigneeId?: string;
        issueType?: string;
        sessionId?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<any[]> {
        return this.ticketRepository.findMany(filters);
    }

    async executeForUser(userId: string, filters: {
        status?: string;
        issueType?: string;
        sessionId?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<any[]> {
        const [reportedTickets, assignedTickets] = await Promise.all([
            this.ticketRepository.findMany({
                ...filters,
                reporterId: userId,
            }),
            this.ticketRepository.findMany({
                ...filters,
                assigneeId: userId,
            }),
        ]);

        const merged = new Map<string, any>();
        for (const ticket of [...reportedTickets, ...assignedTickets]) {
            if (ticket?.id) {
                merged.set(ticket.id, ticket);
            }
        }

        return Array.from(merged.values()).sort((a, b) => {
            const aDate = new Date(a?.createdAt ?? 0).getTime();
            const bDate = new Date(b?.createdAt ?? 0).getTime();
            return bDate - aDate;
        });
    }
}
