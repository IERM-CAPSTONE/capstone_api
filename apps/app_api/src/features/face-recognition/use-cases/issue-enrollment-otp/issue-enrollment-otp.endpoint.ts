import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { IssueEnrollmentOtpDto } from './issue-enrollment-otp.dto';
import { IssueEnrollmentOtpHandler } from './issue-enrollment-otp.handler';
import { GetUser, Roles } from '../../../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';

@ApiTags('Face Recognition')
@ApiBearerAuth()
@Controller('face-recognition/enrollment/otp')
export class IssueEnrollmentOtpEndpoint {
  constructor(private readonly handler: IssueEnrollmentOtpHandler) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER, RoleType.HALL_INVIGILATOR)
  @ApiOperation({
    summary: 'Issue an OTP for student face enrollment (Supervisor only)',
  })
  async execute(@Body() dto: IssueEnrollmentOtpDto, @GetUser() user: any) {
    return this.handler.execute(dto, user);
  }
}
