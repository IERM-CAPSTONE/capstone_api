import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { PaginatedDeviceResponse } from '../../shared';
import { ListAllDevicesDto } from './list-all-devices.dto';
import { ListAllDevicesHandler } from './list-all-devices.handler';

@ApiTags('Devices')
@ApiBearerAuth('JWT-auth')
@Controller('admin/devices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ListAllDevicesEndpoint {
    constructor(private readonly handler: ListAllDevicesHandler) { }

    @Get()
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Get all devices with filters (Admin/ExamOfficer only)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'ownerId', required: false, type: String })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean })
    @ApiResponse({ status: 200, description: 'Devices retrieved', type: PaginatedDeviceResponse })
    async handle(@Query() query: ListAllDevicesDto): Promise<PaginatedDeviceResponse> {
        return this.handler.execute(query);
    }
}
