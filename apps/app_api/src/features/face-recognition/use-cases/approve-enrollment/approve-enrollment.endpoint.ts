import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { ApproveEnrollmentDto } from './approve-enrollment.dto';
import { ApproveEnrollmentHandler } from './approve-enrollment.handler';
import { GetUser, Roles } from '../../../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';

@ApiTags('Face Recognition')
@ApiBearerAuth()
@Controller('face-recognition/enrollment/approve')
export class ApproveEnrollmentEndpoint {
  constructor(private readonly handler: ApproveEnrollmentHandler) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER, RoleType.HALL_INVIGILATOR)
  @ApiOperation({ summary: 'Approve a student face enrollment' })
  async execute(@Body() dto: ApproveEnrollmentDto, @GetUser() user: any) {
    return this.handler.execute(dto, user);
  }
}
