import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '@app/prisma';
import { TicketsCoreModule } from '@app/tickets';
import { NotificationGateway } from '../../common/gateways/notification.gateway';
import { FcmService } from '../../common/fcm/fcm.service';

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
import { ReviewTicketEndpoint } from './use-cases/review-ticket/review-ticket.endpoint';
import { ReviewTicketHandler } from './use-cases/review-ticket/review-ticket.handler';
import { CommentTicketEndpoint } from './use-cases/comment-ticket/comment-ticket.endpoint';
import { CommentTicketHandler } from './use-cases/comment-ticket/comment-ticket.handler';
import { RouteTicketEndpoint } from './use-cases/route-ticket/route-ticket.endpoint';
import { RouteTicketHandler } from './use-cases/route-ticket/route-ticket.handler';
import { LifecycleTicketEndpoint } from './use-cases/lifecycle-ticket/lifecycle-ticket.endpoint';
import { LifecycleTicketHandler } from './use-cases/lifecycle-ticket/lifecycle-ticket.handler';
import { GetTicketStatsEndpoint } from './use-cases/get-ticket-stats/get-ticket-stats.endpoint';
import { GetTicketStatsHandler } from './use-cases/get-ticket-stats/get-ticket-stats.handler';
import { TicketWorkflowService } from './ticket-workflow.service';

@Module({
    imports: [PrismaModule, TicketsCoreModule, HttpModule],
    controllers: [
        CreateTicketEndpoint,
        ListTicketsEndpoint,
        GetTicketStatsEndpoint,
        GetTicketEndpoint,
        ProcessTicketEndpoint,
        BulkProcessTicketEndpoint,
        ReviewTicketEndpoint,
        CommentTicketEndpoint,
        RouteTicketEndpoint,
        LifecycleTicketEndpoint,
    ],
    providers: [
        CreateTicketHandler,
        ListTicketsHandler,
        GetTicketStatsHandler,
        GetTicketHandler,
        ProcessTicketHandler,
        BulkProcessTicketHandler,
        ReviewTicketHandler,
        CommentTicketHandler,
        RouteTicketHandler,
        LifecycleTicketHandler,
        TicketWorkflowService,
        NotificationGateway,
        FcmService,
    ],
})
export class TicketsModule { }
