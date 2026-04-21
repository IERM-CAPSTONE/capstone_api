import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { ListTicketsHandler } from './list-tickets.handler';

@ApiTags('Tickets')
@ApiBearerAuth('JWT-auth')
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ListTicketsEndpoint {
    constructor(private readonly handler: ListTicketsHandler) { }

    @Get()
    @Roles(
        RoleType.EXAM_OFFICER,
        RoleType.PROCTOR,
        RoleType.STUDENT,
        RoleType.IT_SUPPORT,
        RoleType.HALL_INVIGILATOR,
        RoleType.ADMIN,
    )
    @ApiOperation({ summary: 'List tickets (role-filtered)' })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'issueType', required: false })
    @ApiQuery({ name: 'sessionId', required: false })
    @ApiQuery({ name: 'fromDate', required: false, description: 'ISO date string (YYYY-MM-DD)' })
    @ApiQuery({ name: 'toDate', required: false, description: 'ISO date string (YYYY-MM-DD)' })
    async handle(
        @Query('status') status?: string,
        @Query('issueType') issueType?: string,
        @Query('sessionId') sessionId?: string,
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
        @Request() req?: any,
    ): Promise<any[]> {
        const user = req.user;
        const commonFilters = { status, issueType, sessionId, fromDate, toDate };

        // These roles see tickets where they are involved (reporter OR assignee)
        if ([RoleType.IT_SUPPORT, RoleType.HALL_INVIGILATOR, RoleType.PROCTOR, RoleType.STUDENT].includes(user.role)) {
            return this.handler.executeForUser(user.userId, commonFilters);
        }

        // Exam Officers/Admin see all
        return this.handler.execute(commonFilters);
    }
}
