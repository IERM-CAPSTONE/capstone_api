import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { TicketsCoreModule } from '@app/tickets';
import { NotificationGateway } from '../../common/gateways/notification.gateway';

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
// Bulk Process Ticket
import { BulkProcessTicketEndpoint } from './use-cases/bulk-process-ticket/bulk-process-ticket.endpoint';
import { BulkProcessTicketHandler } from './use-cases/bulk-process-ticket/bulk-process-ticket.handler';

@Module({
    imports: [PrismaModule, TicketsCoreModule],
    controllers: [
        CreateTicketEndpoint,
        ListTicketsEndpoint,
        GetTicketEndpoint,
        ProcessTicketEndpoint,
        BulkProcessTicketEndpoint,
    ],
    providers: [
        CreateTicketHandler,
        ListTicketsHandler,
        GetTicketHandler,
        ProcessTicketHandler,
        BulkProcessTicketHandler,
        NotificationGateway,
    ],
})
export class TicketsModule { }
