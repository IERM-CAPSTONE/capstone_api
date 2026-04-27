import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { NotificationGateway } from '../../../../common/gateways';
import { RejectEnrollmentDto } from './reject-enrollment.dto';

@Injectable()
export class RejectEnrollmentHandler {
  private readonly logger = new Logger(RejectEnrollmentHandler.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationGateway: NotificationGateway,
  ) {}

  async execute(dto: RejectEnrollmentDto, user: any) {
    const enrollment = await this.prisma.faceEnrollment.findUnique({
      where: { id: dto.enrollmentId },
      include: { identity: true },
    });

    if (!enrollment) {
      throw new NotFoundException('Khong tim thay yeu cau dang ky');
    }

    if (enrollment.status !== 'PENDING_APPROVAL') {
      throw new BadRequestException('Chi co the tu choi yeu cau dang cho duyet');
    }

    const reviewer = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, code: true, fullName: true, username: true, role: true },
    });

    if (!reviewer) {
      throw new NotFoundException('Khong tim thay nguoi duyet');
    }

    const reason = dto.reason?.trim() || 'Rejected by supervisor';

    const updated = await this.prisma.faceEnrollment.update({
      where: { id: dto.enrollmentId },
      data: {
        status: 'REJECTED',
        isActive: false,
        rejectedAt: new Date(),
        rejectedReason: reason,
        supervisorName:
          reviewer.fullName || reviewer.username || reviewer.code || reviewer.id,
        supervisorCode: reviewer.code || reviewer.id,
        supervisorRole: reviewer.role,
        verificationMethod: 'SUPERVISOR_MANUAL_REJECTION',
      },
    });

    this.logger.log(
      `Enrollment ${dto.enrollmentId} rejected by ${reviewer.username || reviewer.id}. Reason: ${reason}`,
    );

    const targetId = enrollment.identity.userId || enrollment.identity.studentId;
    if (targetId) {
      this.notificationGateway.sendToUser(targetId, 'enrollment_result', {
        enrollmentId: dto.enrollmentId,
        status: 'REJECTED',
        reason,
        message: `Yeu cau dang ky khuon mat cua ban da bi tu choi: ${reason}`,
      });
    }

    return {
      success: true,
      enrollmentId: updated.id,
      status: updated.status,
    };
  }
}
