import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { PaginatedDeviceApplicationResponse } from '../../shared';
import { ListAllDeviceApplicationsDto } from './list-all-applications.dto';
import { ListAllDeviceApplicationsHandler } from './list-all-applications.handler';

@ApiTags('Device Applications')
@ApiBearerAuth('JWT-auth')
@Controller('admin/device-applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ListAllDeviceApplicationsEndpoint {
    constructor(private readonly handler: ListAllDeviceApplicationsHandler) { }

    @Get()
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Get all device applications with filters (Admin/ExamOfficer only)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'deviceId', required: false, type: String })
    @ApiQuery({ name: 'registeredBy', required: false, type: String })
    @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED'] })
    @ApiResponse({ status: 200, description: 'Applications retrieved', type: PaginatedDeviceApplicationResponse })
    async handle(@Query() query: ListAllDeviceApplicationsDto): Promise<PaginatedDeviceApplicationResponse> {
        return this.handler.execute(query);
    }
}
