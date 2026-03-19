import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { TICKET_REPOSITORY, ITicketRepository } from '@app/tickets';

@Injectable()
export class GetTicketHandler {
    constructor(
        @Inject(TICKET_REPOSITORY)
        private readonly ticketRepository: ITicketRepository,
    ) { }

    async execute(id: string): Promise<any> {
        const ticket = await this.ticketRepository.findById(id);
        if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
        return ticket;
    }
}
