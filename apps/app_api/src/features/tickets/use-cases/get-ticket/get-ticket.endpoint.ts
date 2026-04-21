import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { GetTicketHandler } from './get-ticket.handler';

@ApiTags('Tickets')
@ApiBearerAuth('JWT-auth')
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GetTicketEndpoint {
    constructor(private readonly handler: GetTicketHandler) { }

    @Get(':id')
    @Roles(RoleType.EXAM_OFFICER, RoleType.PROCTOR, RoleType.STUDENT, RoleType.IT_SUPPORT, RoleType.HALL_INVIGILATOR, RoleType.ADMIN)
    @ApiOperation({ summary: 'Get ticket detail by ID' })
    async handle(@Param('id') id: string): Promise<any> {
        return this.handler.execute(id);
    }
}
