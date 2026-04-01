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
}
