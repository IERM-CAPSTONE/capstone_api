import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { AttendanceActorType, AttendanceSnapshotStatus } from '@prisma/client';
import { Roles } from '../../../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { ListAttendanceSnapshotsDto } from './list-attendance-snapshots.dto';
import { ListAttendanceSnapshotsHandler } from './list-attendance-snapshots.handler';

@ApiTags('FaceRecognition')
@ApiBearerAuth('JWT-auth')
@Controller('face-recognition/attendance-snapshots')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ListAttendanceSnapshotsEndpoint {
  constructor(private readonly handler: ListAttendanceSnapshotsHandler) {}

  @Get()
  @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER, RoleType.PROCTOR, RoleType.HALL_INVIGILATOR)
  @ApiOperation({ summary: 'List attendance face snapshots' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'examSessionId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: AttendanceSnapshotStatus })
  @ApiQuery({ name: 'actorType', required: false, enum: AttendanceActorType })
  @ApiQuery({ name: 'matchedUserId', required: false, type: String })
  @ApiQuery({ name: 'fromDate', required: false, type: String })
  @ApiQuery({ name: 'toDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Attendance snapshots retrieved successfully' })
  async handle(@Query() query: ListAttendanceSnapshotsDto) {
    return this.handler.execute(query);
  }
}
