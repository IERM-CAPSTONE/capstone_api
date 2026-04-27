import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { NotificationGateway } from '../../../../common/gateways';
import { ApproveEnrollmentDto } from './approve-enrollment.dto';

@Injectable()
export class ApproveEnrollmentHandler {
  private readonly logger = new Logger(ApproveEnrollmentHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async execute(dto: ApproveEnrollmentDto, user: any) {
    const enrollment = await this.prisma.faceEnrollment.findUnique({
      where: { id: dto.enrollmentId },
      include: { identity: true },
    });

    if (!enrollment) {
      throw new NotFoundException('Khong tim thay yeu cau dang ky');
    }

    if (enrollment.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Chi co the duyet yeu cau dang cho duyet');
    }

    const approver = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, code: true, fullName: true, username: true, role: true },
    });

    if (!approver) {
      throw new NotFoundException('Khong tim thay nguoi duyet');
    }

    const updated = await this.prisma.faceEnrollment.update({
      where: { id: dto.enrollmentId },
      data: {
        status: 'APPROVED',
        isActive: true,
        approvedAt: new Date(),
        approvedBy: approver.id,
        supervisorName:
          approver.fullName || approver.username || approver.code || approver.id,
        supervisorCode: approver.code || approver.id,
        supervisorRole: approver.role,
        verificationMethod: 'SUPERVISOR_MANUAL_APPROVAL',
        verificationNote: dto.note,
      },
    });

    await this.prisma.faceEnrollment.updateMany({
      where: {
        identityId: enrollment.identityId,
        id: { not: dto.enrollmentId },
      },
      data: { isActive: false },
    });

    await this.prisma.identity.update({
      where: { id: enrollment.identityId },
      data: {
        isValid: true,
      },
    });

    this.logger.log(
      `Enrollment ${dto.enrollmentId} approved by ${approver.username || approver.id}`,
    );

    const targetId = enrollment.identity.userId || enrollment.identity.studentId;
    if (targetId) {
      this.notificationGateway.sendToUser(targetId, 'enrollment_result', {
        enrollmentId: dto.enrollmentId,
        status: 'APPROVED',
        message: 'Khuon mat cua ban da duoc duyet thanh cong',
      });
    }

    return {
      success: true,
      enrollmentId: updated.id,
      status: updated.status,
    };
  }
}
