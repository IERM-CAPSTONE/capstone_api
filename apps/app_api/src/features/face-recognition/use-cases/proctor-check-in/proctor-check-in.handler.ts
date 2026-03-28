import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, timeout } from 'rxjs';
import {
  RABBITMQ_CLIENTS,
  MESSAGE_PATTERNS,
} from '@app/queue/queue.constants';
import { EncryptionUtils } from '@app/queue/encryption.utils';
import { IUserRepository, USER_REPOSITORY } from '@app/users';
import {
  EXAM_SESSION_REPOSITORY,
  IExamSessionRepository,
} from '@app/exam-sessions';
import { NotificationGateway } from '../../../../common/gateways';
import { ProctorCheckInDto } from './proctor-check-in.dto';

export interface ProctorCheckInResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    matchedUserId?: string;
    userCode?: string;
    userName?: string;
    confidence?: number;
    checkedInAt?: string;
    role?: 'PROCTOR';
  };
}

@Injectable()
export class ProctorCheckInHandler {
  private readonly logger = new Logger(ProctorCheckInHandler.name);
  private readonly encryptionKey: string;
  private readonly requestTimeout = 30000;

  constructor(
    @Inject(RABBITMQ_CLIENTS.FACE_RECOGNITION_SERVICE)
    private readonly faceClient: ClientProxy,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(EXAM_SESSION_REPOSITORY)
    private readonly examSessionRepository: IExamSessionRepository,
    private readonly notificationGateway: NotificationGateway,
    private readonly configService: ConfigService,
  ) {
    this.encryptionKey = this.configService.get<string>(
      'FACE_ENCRYPTION_KEY',
      'MySecureKey12345678901234567890',
    );
  }

  async execute(
    dto: ProctorCheckInDto,
    currentUserId: string,
  ): Promise<ProctorCheckInResponse> {
    try {
      if (!dto.image || dto.image.trim() === '') {
        throw new Error('Image is required');
      }

      const session = await this.examSessionRepository.findById(dto.examSessionId);
      if (!session) {
        throw new Error('Exam session not found');
      }

      if (session.proctorId !== currentUserId) {
        throw new Error('You are not the assigned proctor for this exam session');
      }

      let imageBuffer: Buffer;
      if (dto.isEncrypted) {
        imageBuffer = EncryptionUtils.decryptImage(dto.image, this.encryptionKey);
        if (dto.imageHash) {
          const isValid = EncryptionUtils.verifyHash(imageBuffer, dto.imageHash);
          if (!isValid) {
            throw new Error('Hash verification failed');
          }
        }
      } else {
        imageBuffer = Buffer.from(dto.image, 'base64');
      }

      const result = await lastValueFrom(
        this.faceClient
          .send(MESSAGE_PATTERNS.FACE.AUTHENTICATE, {
            image: imageBuffer.toString('base64'),
            timestamp: new Date().toISOString(),
          })
          .pipe(timeout(this.requestTimeout)),
      );

      if (!result?.student_id) {
        throw new Error('Face not recognized');
      }

      if (result.student_id !== currentUserId) {
        throw new Error('The scanned face does not match the logged in proctor');
      }

      const user = await this.userRepository.findOne({ id: currentUserId });
      const checkedInAt = new Date();

      const updated = session.update({
        proctorCheckedInAt: checkedInAt,
      });

      await this.examSessionRepository.save(updated);

      if (session.campus) {
        this.notificationGateway.sendToCampus(
          String(session.campus),
          'monitor:proctor-checkin',
          {
            examSessionId: session.id,
            proctorId: currentUserId,
            checkedInAt: checkedInAt.toISOString(),
          },
        );
      } else {
        this.notificationGateway.sendToAll('monitor:proctor-checkin', {
          examSessionId: session.id,
          proctorId: currentUserId,
          checkedInAt: checkedInAt.toISOString(),
        });
      }

      return {
        status: 'success',
        message: 'Proctor check-in successful',
        data: {
          matchedUserId: currentUserId,
          userCode: user?.code?.value,
          userName: user?.fullName || undefined,
          confidence: result.confidence,
          checkedInAt: checkedInAt.toISOString(),
          role: 'PROCTOR',
        },
      };
    } catch (error) {
      this.logger.error('Proctor face check-in failed:', error);
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Proctor check-in failed',
      };
    }
  }
}
