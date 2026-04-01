import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { PaginatedAttendanceLogResponse } from '../../shared';
import { ListAllLogsDto } from './list-all-logs.dto';
import { ListAllLogsHandler } from './list-all-logs.handler';

@ApiTags('Attendance Logs')
@ApiBearerAuth('JWT-auth')
@Controller('admin/attendance-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ListAllLogsEndpoint {
    constructor(private readonly handler: ListAllLogsHandler) { }

    @Get()
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER, RoleType.PROCTOR, RoleType.HALL_INVIGILATOR, RoleType.IT_SUPPORT)
    @ApiOperation({ summary: 'Get all attendance logs with filters' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'studentId', required: false, type: String })
    @ApiQuery({ name: 'examSessionId', required: false, type: String })
    @ApiQuery({ name: 'deviceId', required: false, type: String })
    @ApiQuery({ name: 'status', required: false, type: String })
    @ApiResponse({ status: 200, description: 'Attendance logs retrieved', type: PaginatedAttendanceLogResponse })
    async handle(@Query() query: ListAllLogsDto): Promise<PaginatedAttendanceLogResponse> {
        return this.handler.execute(query);
    }
}
