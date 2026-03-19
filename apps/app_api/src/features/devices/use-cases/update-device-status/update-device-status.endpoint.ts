import { Controller, Patch, Param, Body, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { DeviceResponse } from '../../shared';
import { UpdateDeviceStatusDto } from './update-device-status.dto';
import { UpdateDeviceStatusHandler } from './update-device-status.handler';

@ApiTags('Devices')
@ApiBearerAuth('JWT-auth')
@Controller('admin/devices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UpdateDeviceStatusEndpoint {
    constructor(private readonly handler: UpdateDeviceStatusHandler) { }

    @Patch(':id/status')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Update device active status (Admin/ExamOfficer only)' })
    @ApiParam({ name: 'id', description: 'Device UUID' })
    @ApiBody({ type: UpdateDeviceStatusDto })
    @ApiResponse({ status: 200, description: 'Device status updated', type: DeviceResponse })
    @ApiResponse({ status: 404, description: 'Device not found' })
    async handle(
        @Param('id') id: string,
        @Body() dto: UpdateDeviceStatusDto,
    ): Promise<DeviceResponse> {
        try {
            return await this.handler.execute(id, dto);
        } catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                throw new NotFoundException(error.message);
            }
            throw error;
        }
    }
}
