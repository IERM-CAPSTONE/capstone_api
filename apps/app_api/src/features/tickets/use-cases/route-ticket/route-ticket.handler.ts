import { Injectable } from '@nestjs/common';
import { TicketWorkflowService } from '../../ticket-workflow.service';
import { RouteTicketDto } from './route-ticket.dto';

@Injectable()
export class RouteTicketHandler {
    constructor(private readonly workflow: TicketWorkflowService) { }

    async execute(ticketId: string, dto: RouteTicketDto, actorId: string): Promise<any> {
        return this.workflow.routeTicket(ticketId, actorId, dto.targetRole, dto.reason);
    }
}
