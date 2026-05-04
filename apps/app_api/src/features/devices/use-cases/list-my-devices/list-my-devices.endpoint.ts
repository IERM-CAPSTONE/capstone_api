import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles, GetUser } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { DeviceResponse } from '../../shared';
import { ListMyDevicesHandler } from './list-my-devices.handler';

@ApiTags('Devices')
@ApiBearerAuth('JWT-auth')
@Controller('devices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ListMyDevicesEndpoint {
    constructor(private readonly handler: ListMyDevicesHandler) { }

    @Get('me')
    @Roles(RoleType.PROCTOR, RoleType.EXAM_OFFICER, RoleType.HALL_INVIGILATOR)
    @ApiOperation({ summary: 'Get own devices (Proctor only)' })
    @ApiResponse({ status: 200, description: 'Devices retrieved', type: [DeviceResponse] })
    async handle(@GetUser('userId') userId: string): Promise<DeviceResponse[]> {
        return this.handler.execute(userId);
    }
}
