import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles, GetUser } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { ProctorApplicationResponse } from '../../shared/proctor-application.response';
import { ListMyProctorApplicationsHandler } from './list-my-applications.handler';

@ApiTags('Proctor Applications')
@ApiBearerAuth('JWT-auth')
@Controller('proctor-applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ListMyProctorApplicationsEndpoint {
    constructor(private readonly handler: ListMyProctorApplicationsHandler) { }

    @Get('my-applications')
    @Roles(RoleType.PROCTOR, RoleType.HALL_INVIGILATOR)
    @ApiOperation({ summary: 'Get swap requests created by or addressed to the current proctor' })
    @ApiResponse({ status: 200, description: 'Applications retrieved', type: [ProctorApplicationResponse] })
    async handle(@GetUser('userId') userId: string): Promise<ProctorApplicationResponse[]> {
        return this.handler.execute(userId);
    }
}
