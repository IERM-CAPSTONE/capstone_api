import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { lastValueFrom, timeout } from 'rxjs';
import {
  RABBITMQ_CLIENTS,
  MESSAGE_PATTERNS,
} from '@app/queue/queue.constants';
import { EncryptionUtils } from '@app/queue/encryption.utils';
import { IUserRepository, RoleType, USER_REPOSITORY, User } from '@app/users';
import { RegisterFaceDto } from './register-face.dto';
import { NotificationGateway } from '../../../../common/gateways';
import {
  UserResponse,
  toUserResponse,
} from '../../../users/shared/user.response';

export interface RegisterFaceResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    uid?: number;
    embeddings_count?: number;
    student?: UserResponse & {
      created: boolean;
    };
  };
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
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {
    this.encryptionKey = this.configService.get<string>(
      'FACE_ENCRYPTION_KEY',
      'MySecureKey12345678901234567890',
    );

    if (this.encryptionKey.length !== 32) {
      this.logger.error('FACE_ENCRYPTION_KEY must be exactly 32 characters!');
    }
  }

  async execute(dto: RegisterFaceDto): Promise<RegisterFaceResponse> {
    return this.executeWithResolvedStudent(dto);
  }

  async executeWithResolvedStudent(
    dto: RegisterFaceDto,
    targetStudentOverride?: {
      user: User;
      created: boolean;
    },
  ): Promise<RegisterFaceResponse> {
    this.logger.log(
      `Processing face registration for student: ${dto.studentId}`,
    );

    try {
      if (!dto.studentId || dto.studentId.trim() === '') {
        throw new Error('Student ID must not be empty');
      }

      if (!dto.encryptedImages || Object.keys(dto.encryptedImages).length === 0) {
        throw new Error('At least one image is required');
      }

      const decryptedImages: Record<string, Buffer> = {};

      if (dto.isEncrypted) {
        for (const [pose, encryptedData] of Object.entries(dto.encryptedImages)) {
          try {
            const decrypted = EncryptionUtils.decryptImage(
              encryptedData,
              this.encryptionKey,
            );

            if (dto.imageHashes && dto.imageHashes[pose]) {
              const isValid = EncryptionUtils.verifyHash(
                decrypted,
                dto.imageHashes[pose],
              );
              if (!isValid) {
                throw new Error(`Hash verification failed for pose: ${pose}`);
              }
            }

            decryptedImages[pose] = decrypted;
            this.logger.debug(`Decrypted image for pose: ${pose}`);
          } catch (error) {
            this.logger.error(
              `Failed to decrypt image for pose ${pose}:`,
              error,
            );
            throw new Error(`Decryption failed for pose: ${pose}`);
          }
        }
      } else {
        for (const [pose, base64Data] of Object.entries(dto.encryptedImages)) {
          decryptedImages[pose] = Buffer.from(base64Data, 'base64');
        }
      }

      const base64Images: Record<string, string> = {};
      for (const [pose, buffer] of Object.entries(decryptedImages)) {
        base64Images[pose] = buffer.toString('base64');
      }

      const payload = {
        studentId: dto.studentId,
        images: base64Images,
        timestamp: new Date().toISOString(),
      };

      this.logger.log(
        `Sending registration request to RabbitMQ for student: ${dto.studentId}`,
      );

      const result$ = this.faceClient
        .send(MESSAGE_PATTERNS.FACE.REGISTER, payload)
        .pipe(timeout(this.requestTimeout));

      const result = await lastValueFrom(result$);

      this.logger.log(`Registration completed for student: ${dto.studentId}`);

      this.notificationGateway.sendToAll('face_registered', {
        studentId: dto.studentId,
        status: 'success',
        timestamp: new Date().toISOString(),
      });

      const targetStudent =
        targetStudentOverride ?? (await this.getTargetStudentResponse(dto));

      return {
        status: 'success',
        message: 'Face registered successfully',
        data: {
          ...(result as Record<string, unknown>),
          student: targetStudent
            ? {
                ...toUserResponse(targetStudent.user),
                created: targetStudent.created,
              }
            : undefined,
        },
      };
    } catch (error) {
      this.logger.error('Face registration failed:', error);

      return {
        status: 'error',
        message: error instanceof Error
          ? error.message
          : 'Face registration failed',
      };
    }
  }

  async resolveTargetStudentByCode(studentCode: string): Promise<{
    user: User;
    created: boolean;
  }> {
    const normalizedCode = studentCode.trim().toUpperCase();
    if (!normalizedCode) {
      throw new Error('Student code must not be empty');
    }

    const existingUser = await this.userRepository.findOne({
      code: normalizedCode,
    });

    if (existingUser) {
      if (existingUser.role?.value && existingUser.role.value !== RoleType.STUDENT) {
        throw new Error(
          `Code '${normalizedCode}' already belongs to a non-student account`,
        );
      }

      return {
        user: existingUser,
        created: false,
      };
    }

    const user = User.create({
      id: uuidv4(),
      email: `${normalizedCode.toLowerCase()}@student.local`,
      username: normalizedCode.toLowerCase(),
      fullName: normalizedCode,
      code: normalizedCode,
      role: RoleType.STUDENT,
      isActive: true,
    });

    const savedUser = await this.userRepository.save(user);
    return {
      user: savedUser,
      created: true,
    };
  }

  private async getTargetStudentResponse(dto: RegisterFaceDto): Promise<{
    user: User;
    created: boolean;
  } | null> {
    if (dto.studentCode && dto.studentCode.trim() !== '') {
      return this.resolveTargetStudentByCode(dto.studentCode);
    }

    if (!dto.studentId || dto.studentId.trim() === '') {
      return null;
    }

    const user = await this.userRepository.findOne({ id: dto.studentId });
    if (!user) {
      return null;
    }

    return {
      user,
      created: false,
    };
  }
}
