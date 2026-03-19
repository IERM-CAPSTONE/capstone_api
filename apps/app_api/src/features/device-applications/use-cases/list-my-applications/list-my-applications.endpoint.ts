import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles, GetUser } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { DeviceApplicationResponse } from '../../shared';
import { ListMyDeviceApplicationsHandler } from './list-my-applications.handler';

@ApiTags('Device Applications')
@ApiBearerAuth('JWT-auth')
@Controller('device-applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ListMyDeviceApplicationsEndpoint {
    constructor(private readonly handler: ListMyDeviceApplicationsHandler) { }

    @Get('me')
    @Roles(RoleType.PROCTOR)
    @ApiOperation({ summary: 'Get own device applications (Proctor only)' })
    @ApiResponse({ status: 200, description: 'Applications retrieved', type: [DeviceApplicationResponse] })
    async handle(@GetUser('userId') userId: string): Promise<DeviceApplicationResponse[]> {
        return this.handler.execute(userId);
    }
}
