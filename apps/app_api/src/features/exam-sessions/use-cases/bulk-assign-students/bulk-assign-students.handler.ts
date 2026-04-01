import { Injectable } from '@nestjs/common';
import { FinalizeSeatAssignmentsHandler } from '../finalize-seats';

@Injectable()
export class BulkAssignStudentsHandler {
    constructor(
        private readonly finalizeSeatAssignmentsHandler: FinalizeSeatAssignmentsHandler,
    ) { }

    async handle(examSessionId: string) {
        return this.finalizeSeatAssignmentsHandler.handle(examSessionId);
    }
}
