import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, timeout } from 'rxjs';
import * as crypto from 'crypto';
import { RoleType } from '@app/users';
import { PrismaService } from '@app/prisma';
import { RABBITMQ_CLIENTS, MESSAGE_PATTERNS } from '@app/queue/queue.constants';
import { EncryptionUtils } from '@app/queue/encryption.utils';
import { RegisterFaceDto } from './register-face.dto';
import { NotificationGateway } from '../../../../common/gateways';
import { CloudinaryService } from '../../../../common/cloudinary/cloudinary.service';

export interface RegisterFaceResponse {
  status: 'success' | 'error';
  message: string;
  data?: any;
}

@Injectable()
export class RegisterFaceHandler {
  private readonly logger = new Logger(RegisterFaceHandler.name);
  private readonly encryptionKey: string;
  private readonly requestTimeout = 30000;

  constructor(
    @Inject(RABBITMQ_CLIENTS.FACE_RECOGNITION_SERVICE)
    private readonly faceClient: ClientProxy,
    private readonly configService: ConfigService,
    private readonly notificationGateway: NotificationGateway,
    private readonly cloudinaryService: CloudinaryService,
    private readonly prisma: PrismaService,
  ) {
    this.encryptionKey = this.configService.get<string>(
      'FACE_ENCRYPTION_KEY',
      'MySecureKey12345678901234567890',
    );
  }

  async execute(
    dto: RegisterFaceDto,
    currentUser: { userId: string; role: string },
  ): Promise<RegisterFaceResponse> {
    const normalizedRole = (currentUser.role ?? '').toUpperCase();
    const currentDbUser = await this.prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { id: true, code: true, fullName: true, username: true, role: true },
    });

    if (!currentDbUser) {
      throw new NotFoundException('Khong tim thay nguoi dung hien tai');
    }

    if (normalizedRole === RoleType.STUDENT && !dto.otp) {
      throw new BadRequestException(
        'Sinh vien can OTP tu giam thi de dang ky khuon mat',
      );
    }

    let isSupervised = false;
    let otpRecord: {
      id: string;
      studentCode: string;
      issuedById: string;
      issuedByName: string;
      issuedByRole: string;
    } | null = null;

    if (dto.otp) {
      if (!currentDbUser.code) {
        throw new BadRequestException('Tai khoan khong co ma sinh vien');
      }

      const otpHash = crypto.createHash('sha256').update(dto.otp).digest('hex');
      otpRecord = await this.prisma.enrollmentOTP.findFirst({
        where: {
          studentCode: currentDbUser.code.toUpperCase(),
          otpHash,
          usedAt: { not: null },
        },
        select: {
          id: true,
          studentCode: true,
          issuedById: true,
          issuedByName: true,
          issuedByRole: true,
        },
      });

      if (!otpRecord) {
        throw new BadRequestException('OTP khong hop le hoac da het han');
      }

      isSupervised = true;
    }

    try {
      const decryptedImages: Record<string, Buffer> = {};
      for (const [pose, data] of Object.entries(dto.encryptedImages)) {
        decryptedImages[pose] = dto.isEncrypted
          ? EncryptionUtils.decryptImage(data, this.encryptionKey)
          : Buffer.from(data, 'base64');
      }

      const base64Images: Record<string, string> = {};
      for (const [pose, buffer] of Object.entries(decryptedImages)) {
        base64Images[pose] = buffer.toString('base64');
      }

      const targetStudent = dto.studentCode
        ? await this.resolveTargetStudentByCode(dto.studentCode)
        : currentDbUser;

      if (
        normalizedRole === RoleType.STUDENT &&
        targetStudent.id !== currentDbUser.id
      ) {
        throw new BadRequestException(
          'Sinh vien chi duoc dang ky khuon mat cho chinh minh',
        );
      }

      const result$ = this.faceClient
        .send(MESSAGE_PATTERNS.FACE.REGISTER, {
          studentId: targetStudent.id,
          images: base64Images,
        })
        .pipe(timeout(this.requestTimeout));

      const aiResult = await lastValueFrom(result$);
      const vector = aiResult?.vector || {};
      const capturedImageUrls = await this.uploadCapturedImages(
        decryptedImages,
        targetStudent.code || targetStudent.id,
      );

      const identity = await this.prisma.identity.upsert({
        where: { studentId: targetStudent.id },
        update: { userId: targetStudent.id },
        create: {
          studentId: targetStudent.id,
          userId: targetStudent.id,
          isValid: false,
        },
      });

      const faceImagePurgeAt =
        dto.retentionPolicy === 'SHORT_TERM_14_DAYS'
          ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          : undefined;

      const enrollment = await this.prisma.faceEnrollment.create({
        data: {
          identityId: identity.id,
          vector,
          quality: aiResult?.quality || 1.0,
          status: isSupervised ? 'PENDING_APPROVAL' : 'APPROVED',
          isActive: !isSupervised,
          retentionPolicy: dto.retentionPolicy as any,
          capturedImageUrls,
          retentionConsentedAt: dto.retentionPolicy ? new Date() : undefined,
          faceImagePurgeAt,
          supervisorName: otpRecord?.issuedByName,
          supervisorCode: otpRecord?.issuedById,
          supervisorRole: otpRecord?.issuedByRole,
          verificationMethod: isSupervised
            ? 'SUPERVISOR_OTP_MANUAL_CHECK'
            : undefined,
        },
      });

      if (otpRecord) {
        this.notificationGateway.sendToUser(
          otpRecord.issuedById,
          'enrollment_pending',
          {
            enrollmentId: enrollment.id,
            studentCode: otpRecord.studentCode,
            message: 'Co yeu cau dang ky khuon mat moi can duyet',
          },
        );
      } else {
        await this.prisma.identity.update({
          where: { id: identity.id },
          data: { isValid: true },
        });
      }

      return {
        status: 'success',
        message: isSupervised
          ? 'Da gui yeu cau dang ky, vui long cho giam thi duyet'
          : 'Dang ky thanh cong',
        data: {
          enrollmentId: enrollment.id,
          status: enrollment.status,
          studentCode: targetStudent.code,
          studentName: targetStudent.fullName,
          capturedImageUrls,
        },
      };
    } catch (error) {
      this.logger.error('Face registration failed:', error);
      return { status: 'error', message: error.message };
    }
  }

  private async resolveTargetStudentByCode(code: string) {
    const student = await this.prisma.user.findFirst({
      where: {
        code: code.trim().toUpperCase(),
        role: RoleType.STUDENT as any,
        isActive: true,
      },
      select: { id: true, code: true, fullName: true, username: true, role: true },
    });

    if (!student) {
      throw new NotFoundException('Khong tim thay sinh vien');
    }

    return student;
  }

  private async uploadCapturedImages(
    images: Record<string, Buffer>,
    studentCodeOrId: string,
  ) {
    const safeStudentCode = studentCodeOrId.replace(/[^a-zA-Z0-9_-]/g, '');
    const uploaded: Record<string, string> = {};

    for (const [pose, buffer] of Object.entries(images)) {
      uploaded[pose] = await this.cloudinaryService.uploadImage(
        buffer,
        `face-enrollments/${safeStudentCode}`,
      );
    }

    return uploaded;
  }
}
