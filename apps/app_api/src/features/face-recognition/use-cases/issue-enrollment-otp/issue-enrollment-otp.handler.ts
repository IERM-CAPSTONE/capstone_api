import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { RoleType } from '@app/users';
import * as crypto from 'crypto';
import { IssueEnrollmentOtpDto } from './issue-enrollment-otp.dto';

@Injectable()
export class IssueEnrollmentOtpHandler {
  private readonly logger = new Logger(IssueEnrollmentOtpHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(dto: IssueEnrollmentOtpDto, user: any) {
    const issuer = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, code: true, fullName: true, username: true, role: true },
    });

    if (!issuer) {
      throw new NotFoundException('Khong tim thay giam thi');
    }

    const studentCode = dto.studentCode.trim().toUpperCase();
    const student = await this.prisma.user.findFirst({
      where: { code: studentCode, role: RoleType.STUDENT as any, isActive: true },
      select: { id: true },
    });

    if (!student) {
      throw new BadRequestException('Khong tim thay sinh vien hop le');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 1000);

    await this.prisma.enrollmentOTP.create({
      data: {
        studentCode,
        otpHash,
        expiresAt,
        issuedById: issuer.id,
        issuedByName:
          issuer.fullName || issuer.username || issuer.code || issuer.id,
        issuedByRole: issuer.role || 'HALL_INVIGILATOR',
      },
    });

    this.logger.log(
      `OTP issued for student ${studentCode} by ${issuer.username || issuer.id}`,
    );

    return {
      otp,
      expiresAt,
      expiresIn: 30,
      studentCode,
    };
  }
}
