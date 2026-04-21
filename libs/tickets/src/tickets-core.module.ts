import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { TICKET_REPOSITORY } from './domain';
import { PrismaTicketRepository } from './infrastructure';

@Global()
@Module({
    imports: [PrismaModule],
    providers: [
        {
            provide: TICKET_REPOSITORY,
            useClass: PrismaTicketRepository,
        },
    ],
    exports: [TICKET_REPOSITORY],
})
export class TicketsCoreModule { }
