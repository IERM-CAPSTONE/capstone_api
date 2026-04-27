import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import * as crypto from 'crypto';
import { VerifyEnrollmentOtpDto } from './verify-enrollment-otp.dto';

@Injectable()
export class VerifyEnrollmentOtpHandler {
  private readonly logger = new Logger(VerifyEnrollmentOtpHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: VerifyEnrollmentOtpDto, user: any) {
    const student = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, code: true },
    });

    if (!student?.code) {
      throw new NotFoundException('Khong tim thay ma sinh vien');
    }

    const otpHash = crypto.createHash('sha256').update(dto.otp).digest('hex');

    const otpRecord = await this.prisma.enrollmentOTP.findFirst({
      where: {
        studentCode: student.code.toUpperCase(),
        otpHash,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord) {
      this.logger.warn(`Invalid OTP attempt for student ${student.code}`);
      throw new BadRequestException('OTP khong hop le hoac da het han');
    }

    await this.prisma.enrollmentOTP.update({
      where: { id: otpRecord.id },
      data: { usedAt: new Date() },
    });

    this.logger.log(`OTP verified for student ${student.code}`);

    return {
      success: true,
      studentCode: otpRecord.studentCode,
      expiresIn: Math.max(
        0,
        Math.ceil((otpRecord.expiresAt.getTime() - Date.now()) / 1000),
      ),
    };
  }
}
