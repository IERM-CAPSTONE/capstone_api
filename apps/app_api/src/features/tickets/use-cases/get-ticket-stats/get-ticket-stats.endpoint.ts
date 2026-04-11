import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { GetTicketStatsHandler } from './get-ticket-stats.handler';
import { GetTicketStatsQueryDto } from './get-ticket-stats.dto';

@ApiTags('Tickets')
@ApiBearerAuth('JWT-auth')
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GetTicketStatsEndpoint {
    constructor(private readonly handler: GetTicketStatsHandler) { }

    @Get('stats/overview')
    @Roles(RoleType.EXAM_OFFICER, RoleType.ADMIN)
    @ApiOperation({ summary: 'Get ticket statistics overview by semester and week' })
    async handle(@Query() query: GetTicketStatsQueryDto) {
        return this.handler.execute(query);
    }
}
