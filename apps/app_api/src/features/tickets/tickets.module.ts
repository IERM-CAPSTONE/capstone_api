import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { TicketsCoreModule } from '@app/tickets';

// Create Ticket
import { CreateTicketEndpoint } from './use-cases/create-ticket/create-ticket.endpoint';
import { CreateTicketHandler } from './use-cases/create-ticket/create-ticket.handler';
// List Tickets
import { ListTicketsEndpoint } from './use-cases/list-tickets/list-tickets.endpoint';
import { ListTicketsHandler } from './use-cases/list-tickets/list-tickets.handler';
// Get Ticket
import { GetTicketEndpoint } from './use-cases/get-ticket/get-ticket.endpoint';
import { GetTicketHandler } from './use-cases/get-ticket/get-ticket.handler';
// Process Ticket
import { ProcessTicketEndpoint } from './use-cases/process-ticket/process-ticket.endpoint';
import { ProcessTicketHandler } from './use-cases/process-ticket/process-ticket.handler';

@Module({
    imports: [PrismaModule, TicketsCoreModule],
    controllers: [
        CreateTicketEndpoint,
        ListTicketsEndpoint,
        GetTicketEndpoint,
        ProcessTicketEndpoint,
    ],
    providers: [
        CreateTicketHandler,
        ListTicketsHandler,
        GetTicketHandler,
        ProcessTicketHandler,
    ],
})
export class TicketsModule { }
