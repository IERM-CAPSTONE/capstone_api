import { Body, Controller, Param, Patch, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { LifecycleTicketDto } from './lifecycle-ticket.dto';
import { LifecycleTicketHandler } from './lifecycle-ticket.handler';

@ApiTags('Tickets')
@ApiBearerAuth('JWT-auth')
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LifecycleTicketEndpoint {
    constructor(private readonly handler: LifecycleTicketHandler) { }

    @Patch(':id/lifecycle')
    @Roles(
        RoleType.EXAM_OFFICER,
        RoleType.HALL_INVIGILATOR,
        RoleType.IT_SUPPORT,
        RoleType.ADMIN,
        RoleType.PROCTOR,
        RoleType.STUDENT,
    )
    @ApiOperation({ summary: 'Apply START / REOPEN / ACKNOWLEDGE / CLOSE to a ticket' })
    async handle(
        @Param('id') id: string,
        @Body() dto: LifecycleTicketDto,
        @Request() req: any,
    ): Promise<any> {
        return this.handler.execute(id, dto, req.user.userId);
    }
}
