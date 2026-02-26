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
import { IStudentExamRepository, STUDENT_EXAM_REPOSITORY } from '@app/student-exams';
import { AuthenticateFaceDto } from './authenticate-face.dto';
import { NotificationGateway } from '../../../../common/gateways';

export interface AuthenticateFaceResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    uid?: number;
    studentId?: string;
    studentCode?: string;
    studentName?: string;
    confidence?: number;
    isCorrectRoom?: boolean;
  };
}

@Injectable()
export class AuthenticateFaceHandler {
  private readonly logger = new Logger(AuthenticateFaceHandler.name);
  private readonly encryptionKey: string;
  private readonly requestTimeout = 30000; // 30 seconds

  constructor(
    @Inject(RABBITMQ_CLIENTS.FACE_RECOGNITION_SERVICE)
    private readonly faceClient: ClientProxy,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(STUDENT_EXAM_REPOSITORY) private readonly studentExamRepository: IStudentExamRepository,
    private readonly configService: ConfigService,
    private readonly notificationGateway: NotificationGateway,
  ) {
    // Get encryption key from environment
    this.encryptionKey = this.configService.get<string>(
      'FACE_ENCRYPTION_KEY',
      'MySecureKey12345678901234567890', // Must be 32 chars, same as Flutter
    );

    if (this.encryptionKey.length !== 32) {
      this.logger.error('FACE_ENCRYPTION_KEY must be exactly 32 characters!');
    }
  }

  async execute(dto: AuthenticateFaceDto): Promise<AuthenticateFaceResponse> {
    this.logger.log(`Processing face authentication. Request DTO: ${JSON.stringify({ ...dto, image: dto.image?.substring(0, 20) + '...' })}`);

    try {
      // Validation
      if (!dto.image || dto.image.trim() === '') {
        throw new Error('Image is required');
      }

      // Decrypt image if encrypted
      let imageBuffer: Buffer;

      if (dto.isEncrypted) {
        imageBuffer = EncryptionUtils.decryptImage(
          dto.image,
          this.encryptionKey,
        );

        // Verify hash if provided
        if (dto.imageHash) {
          const isValid = EncryptionUtils.verifyHash(
            imageBuffer,
            dto.imageHash,
          );
          if (!isValid) {
            throw new Error('Hash verification failed');
          }
        }

        this.logger.debug('Image decrypted successfully');
      } else {
        imageBuffer = Buffer.from(dto.image, 'base64');
      }

      // Convert to base64 for RabbitMQ transmission
      const base64Image = imageBuffer.toString('base64');

      // Send to RabbitMQ (Python worker)
      const payload = {
        image: base64Image,
        timestamp: new Date().toISOString(),
      };

      this.logger.log('Sending authentication request to RabbitMQ');

      // Send message and wait for response
      const result$ = this.faceClient
        .send(MESSAGE_PATTERNS.FACE.AUTHENTICATE, payload)
        .pipe(timeout(this.requestTimeout));

      const result = await lastValueFrom(result$);
      this.logger.log(`AI result received: ${JSON.stringify(result)}`);

      this.logger.log('Authentication completed');

      // Fetch additional user info if studentId is present
      let studentCode: string | undefined;
      let studentName: string | undefined;
      let isCorrectRoom = true;

      if (result && result.student_id) {
        try {
          // 1. Identify student
          const user = await this.userRepository.findOne({ id: result.student_id });
          if (user) {
            studentCode = user.code?.value;
            studentName = user.fullName || undefined;
            this.logger.log(`User identified: ${studentName} (${studentCode})`);
          } else {
            this.logger.warn(`Student ID ${result.student_id} returned by AI not found in database`);
          }

          // 2. Check if student belongs to the session (if session provided)
          if (dto.examSessionId) {
            isCorrectRoom = await this.studentExamRepository.exists({
              examSessionId: dto.examSessionId,
              studentId: result.student_id,
            });

            if (!isCorrectRoom) {
              this.logger.warn(`Student ${studentCode} identified but is NOT in session ${dto.examSessionId}`);
            } else {
              // 3. Update check-in status if correct room
              this.logger.log(`Student ${studentCode} confirmed for session. Updating check-in status...`);
              await this.studentExamRepository.checkIn(result.student_id, dto.examSessionId);
            }
          }
        } catch (e) {
          this.logger.error(`Failed to fetch user info for ID ${result.student_id}:`, e);
        }
      } else {
        this.logger.warn('Face authentication completed but no studentId was matched');
      }

      if (!isCorrectRoom && studentCode) {
        return {
          status: 'error',
          message: `Student ${studentName} (${studentCode}) does not belong to this exam room!`,
          data: {
            ...result,
            status: 'error',
            studentCode,
            studentName,
            isCorrectRoom,
          },
        };
      }

      const response: AuthenticateFaceResponse = {
        status: 'success',
        message: 'Face authenticated successfully',
        data: {
          ...result,
          studentCode,
          studentName,
          isCorrectRoom,
        },
      };

      this.logger.log(`Final Response: ${JSON.stringify(response)}`);

      // Emit socket event for successful authentication
      if (result && result.student_id && isCorrectRoom) {
        this.notificationGateway.sendToAll('face_authenticated', {
          studentId: result.student_id,
          studentCode,
          studentName,
          confidence: result.confidence,
          isCorrectRoom,
          status: 'success',
          timestamp: new Date().toISOString(),
        });
      }

      return response;
    } catch (error) {
      this.logger.error('Face authentication failed:', error);

      const errorResponse: AuthenticateFaceResponse = {
        status: 'error',
        message: error.message || 'Face authentication failed',
      };
      this.logger.error(`Authentication failed: ${JSON.stringify(errorResponse)}`);
      return errorResponse;
    }
  }
}
