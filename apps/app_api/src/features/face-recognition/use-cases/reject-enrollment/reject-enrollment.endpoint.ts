import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { RejectEnrollmentDto } from './reject-enrollment.dto';
import { RejectEnrollmentHandler } from './reject-enrollment.handler';
import { GetUser, Roles } from '../../../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';

@ApiTags('Face Recognition')
@ApiBearerAuth()
@Controller('face-recognition/enrollment/reject')
export class RejectEnrollmentEndpoint {
  constructor(private readonly handler: RejectEnrollmentHandler) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER, RoleType.HALL_INVIGILATOR)
  @ApiOperation({ summary: 'Reject a student face enrollment' })
  async execute(@Body() dto: RejectEnrollmentDto, @GetUser() user: any) {
    return this.handler.execute(dto, user);
  }
}
