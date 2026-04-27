import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';

@Injectable()
export class ListPendingEnrollmentsHandler {
  constructor(private readonly prisma: PrismaService) {}

  async execute(_user: any) {
    const enrollments = await this.prisma.faceEnrollment.findMany({
      where: { status: 'PENDING_APPROVAL' },
      orderBy: { createdAt: 'desc' },
      include: {
        identity: {
          include: {
            user: {
              select: {
                id: true,
                code: true,
                fullName: true,
                email: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return enrollments.map((enrollment) => ({
      id: enrollment.id,
      enrollmentId: enrollment.id,
      status: enrollment.status,
      quality: enrollment.quality,
      createdAt: enrollment.createdAt,
      retentionPolicy: enrollment.retentionPolicy,
      supervisorName: enrollment.supervisorName,
      supervisorCode: enrollment.supervisorCode,
      supervisorRole: enrollment.supervisorRole,
      verificationMethod: enrollment.verificationMethod,
      verificationNote: enrollment.verificationNote,
      capturedImageUrls: enrollment.capturedImageUrls,
      studentId: enrollment.identity.studentId,
      studentCode: enrollment.identity.user?.code,
      studentName: enrollment.identity.user?.fullName,
      studentEmail: enrollment.identity.user?.email,
      avatarUrl: enrollment.identity.user?.avatarUrl,
      faceImageUrl:
        this.getPrimaryFaceImage(enrollment.capturedImageUrls) ||
        enrollment.identity.faceImage,
    }));
  }

  private getPrimaryFaceImage(capturedImageUrls: unknown): string | undefined {
    if (!capturedImageUrls || typeof capturedImageUrls !== 'object') {
      return undefined;
    }

    const urls = capturedImageUrls as Record<string, unknown>;
    const firstUrl = urls.center || Object.values(urls)[0];
    return typeof firstUrl === 'string' ? firstUrl : undefined;
  }
}
