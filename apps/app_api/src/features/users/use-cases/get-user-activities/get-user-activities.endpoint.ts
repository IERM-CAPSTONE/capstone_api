import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { GetUserActivitiesHandler, UserActivityResponse } from './get-user-activities.handler';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GetUserActivitiesEndpoint {
    constructor(private readonly handler: GetUserActivitiesHandler) { }

    @Get(':id/activities')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Get user activity logs' })
    @ApiResponse({
        status: 200,
        description: 'Returns a list of account activities',
    })
    async execute(@Param('id') id: string): Promise<UserActivityResponse[]> {
        return this.handler.execute(id);
    }

    @Get('activities/all')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Get all user activity logs' })
    @ApiResponse({
        status: 200,
        description: 'Returns a list of all account activities',
    })
    async executeGlobal(): Promise<UserActivityResponse[]> {
        return this.handler.executeGlobal(10);
    }
}
