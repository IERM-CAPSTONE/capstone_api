import { Body, Controller, Param, Patch, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { RouteTicketDto } from './route-ticket.dto';
import { RouteTicketHandler } from './route-ticket.handler';

@ApiTags('Tickets')
@ApiBearerAuth('JWT-auth')
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RouteTicketEndpoint {
    constructor(private readonly handler: RouteTicketHandler) { }

    @Patch(':id/route')
    @Roles(
        RoleType.EXAM_OFFICER,
        RoleType.ADMIN,
        RoleType.PROCTOR,
        RoleType.HALL_INVIGILATOR,
    )
    @ApiOperation({ summary: 'Route a ticket to a target role and auto-assign a concrete user' })
    async handle(
        @Param('id') id: string,
        @Body() dto: RouteTicketDto,
        @Request() req: any,
    ): Promise<any> {
        return this.handler.execute(id, dto, req.user.userId);
    }
}
