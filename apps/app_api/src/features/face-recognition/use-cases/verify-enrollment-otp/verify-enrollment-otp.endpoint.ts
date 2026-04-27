import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { VerifyEnrollmentOtpDto } from './verify-enrollment-otp.dto';
import { VerifyEnrollmentOtpHandler } from './verify-enrollment-otp.handler';
import { GetUser, Roles } from '../../../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';

@ApiTags('Face Recognition')
@ApiBearerAuth()
@Controller('face-recognition/enrollment/verify-otp')
export class VerifyEnrollmentOtpEndpoint {
  constructor(private readonly handler: VerifyEnrollmentOtpHandler) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.STUDENT)
  @ApiOperation({ summary: 'Verify OTP for student face enrollment' })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async execute(@Body() dto: VerifyEnrollmentOtpDto, @GetUser() user: any) {
    return this.handler.execute(dto, user);
  }
}
