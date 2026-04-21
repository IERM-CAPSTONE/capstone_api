import { Injectable } from '@nestjs/common';
import { TicketWorkflowService } from '../../ticket-workflow.service';
import { LifecycleTicketDto } from './lifecycle-ticket.dto';

@Injectable()
export class LifecycleTicketHandler {
    constructor(private readonly workflow: TicketWorkflowService) { }

    async execute(ticketId: string, dto: LifecycleTicketDto, actorId: string): Promise<any> {
        return this.workflow.applyLifecycle(ticketId, actorId, dto.action, dto.note);
    }
}
