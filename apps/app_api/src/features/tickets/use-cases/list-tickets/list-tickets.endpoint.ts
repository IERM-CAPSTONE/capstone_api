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
        RoleType.IT_SUPPORT,
        RoleType.HALL_INVIGILATOR,
    )
    @ApiOperation({ summary: 'List tickets (role-filtered)' })
    @ApiQuery({ name: 'status', required: false })
    @ApiQuery({ name: 'issueType', required: false })
    async handle(
        @Query('status') status?: string,
        @Query('issueType') issueType?: string,
        @Request() req?: any,
    ): Promise<any[]> {
        const user = req.user;

        // Hall Invigilator / IT Support → tickets assigned to them
        if ([RoleType.IT_SUPPORT, RoleType.HALL_INVIGILATOR].includes(user.role)) {
            return this.handler.execute({ status, issueType, assigneeId: user.userId });
        }

        // Proctor → tickets they reported
        if (user.role === RoleType.PROCTOR) {
            return this.handler.execute({ status, issueType, reporterId: user.userId });
        }

        // Exam Officers see all
        return this.handler.execute({ status, issueType });
    }
}
