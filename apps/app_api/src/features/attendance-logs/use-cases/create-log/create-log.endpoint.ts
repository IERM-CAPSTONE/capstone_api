import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { AttendanceLogResponse } from '../../shared';
import { CreateAttendanceLogDto } from './create-log.dto';
import { CreateAttendanceLogHandler } from './create-log.handler';

@ApiTags('Attendance Logs')
@ApiBearerAuth('JWT-auth')
@Controller('admin/attendance-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CreateAttendanceLogEndpoint {
    constructor(private readonly handler: CreateAttendanceLogHandler) { }

    @Post()
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER, RoleType.PROCTOR, RoleType.HALL_INVIGILATOR, RoleType.IT_SUPPORT)
    @ApiOperation({ summary: 'Create a new attendance log (ghi lại)' })
    @ApiResponse({ status: 201, description: 'Attendance log created', type: AttendanceLogResponse })
    async handle(@Body() dto: CreateAttendanceLogDto): Promise<AttendanceLogResponse> {
        return this.handler.execute(dto);
    }
}
