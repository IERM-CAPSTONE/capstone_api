import { Controller, Get, Param, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles, GetUser } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { DeviceResponse } from '../../shared';
import { GetDeviceHandler } from './get-device.handler';

@ApiTags('Devices')
@ApiBearerAuth('JWT-auth')
@Controller('devices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GetDeviceEndpoint {
    constructor(private readonly handler: GetDeviceHandler) { }

    @Get(':id')
    @Roles(RoleType.PROCTOR, RoleType.HALL_INVIGILATOR, RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Get device by id' })
    @ApiParam({ name: 'id', description: 'Device UUID' })
    @ApiResponse({ status: 200, description: 'Device retrieved', type: DeviceResponse })
    @ApiResponse({ status: 404, description: 'Device not found' })
    async handle(
        @Param('id') id: string,
        @GetUser('userId') userId: string,
        @GetUser('role') role: string,
    ): Promise<DeviceResponse> {
        try {
            return await this.handler.execute(id, userId, role);
        } catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                throw new NotFoundException(error.message);
            }
            throw error;
        }
    }
}
