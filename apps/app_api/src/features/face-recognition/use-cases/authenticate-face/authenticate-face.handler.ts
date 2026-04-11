import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, timeout } from 'rxjs';
import {
  RABBITMQ_CLIENTS,
  MESSAGE_PATTERNS,
} from '@app/queue/queue.constants';
import { AttendanceSnapshotUploadJobData } from '@app/queue';
import { EncryptionUtils } from '@app/queue/encryption.utils';
import { IUserRepository, USER_REPOSITORY } from '@app/users';
import { IStudentExamRepository, STUDENT_EXAM_REPOSITORY } from '@app/student-exams';
import { PrismaService } from '@app/prisma';
import {
  AttendanceActorType,
  AttendanceSnapshotStatus,
} from '@prisma/client';
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
    @Inject(RABBITMQ_CLIENTS.EXAM_SERVICE)
    private readonly examClient: ClientProxy,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    @Inject(STUDENT_EXAM_REPOSITORY) private readonly studentExamRepository: IStudentExamRepository,
    private readonly prisma: PrismaService,
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

  async execute(
    dto: AuthenticateFaceDto,
    actor?: { userId?: string; role?: string },
  ): Promise<AuthenticateFaceResponse> {
    this.logger.log(`Processing face authentication. Request DTO: ${JSON.stringify({ ...dto, image: dto.image?.substring(0, 20) + '...' })}`);

    let imageBuffer: Buffer | null = null;
    let snapshotRecorded = false;
    const captureTimestamp = new Date();

    try {
      // Validation
      if (!dto.image || dto.image.trim() === '') {
        throw new Error('Image is required');
      }

      // Decrypt image if encrypted
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
              await this.studentExamRepository.checkIn(result.student_id, dto.examSessionId, dto.examPartCode);
            }
          }
        } catch (e) {
          this.logger.error(`Failed to fetch user info for ID ${result.student_id}:`, e);
        }
      } else {
        this.logger.warn('Face authentication completed but no studentId was matched');
      }

      const snapshotStatus = !result?.student_id
        ? AttendanceSnapshotStatus.NOT_MATCHED
        : !isCorrectRoom
          ? AttendanceSnapshotStatus.WRONG_ROOM
          : AttendanceSnapshotStatus.MATCHED;

      await this.createAttendanceSnapshot({
        actorType: AttendanceActorType.STUDENT,
        examSessionId: dto.examSessionId,
        examPartCode: dto.examPartCode,
        capturedUserId:
          actor?.role === 'STUDENT' ? actor.userId : undefined,
        matchedUserId: result?.student_id,
        status: snapshotStatus,
        confidence: result?.confidence,
        imageBuffer,
        captureTimestamp,
      });
      snapshotRecorded = true;

      if (!isCorrectRoom && studentCode) {
        let anomalyCampus: string | null = null;
        if (dto.examSessionId) {
          const session = await this.prisma.examSession.findUnique({
            where: { id: dto.examSessionId },
            select: { campus: true },
          });
          anomalyCampus = session?.campus ?? null;
        }

        const anomalyPayload = {
          eventType: 'student_wrong_room',
          examSessionId: dto.examSessionId,
          studentId: result.student_id,
          studentCode,
          studentName,
          confidence: result.confidence,
          timestamp: new Date().toISOString(),
        };

        if (anomalyCampus) {
          this.notificationGateway.sendToCampus(anomalyCampus, 'monitor:student_anomaly', anomalyPayload);
        } else {
          this.notificationGateway.sendToAll('monitor:student_anomaly', anomalyPayload);
        }

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
          examSessionId: dto.examSessionId,
          examPartCode: dto.examPartCode,
          confidence: result.confidence,
          isCorrectRoom,
          status: 'success',
          timestamp: new Date().toISOString(),
        });
      }

      return response;
    } catch (error) {
      this.logger.error('Face authentication failed:', error);

      if (!snapshotRecorded && imageBuffer && dto.examSessionId) {
        await this.createAttendanceSnapshot({
          actorType: AttendanceActorType.STUDENT,
          examSessionId: dto.examSessionId,
          examPartCode: dto.examPartCode,
          capturedUserId:
            actor?.role === 'STUDENT' ? actor.userId : undefined,
          matchedUserId: undefined,
          status: AttendanceSnapshotStatus.FAILED,
          confidence: undefined,
          imageBuffer,
          captureTimestamp,
        });
      }

      const errorResponse: AuthenticateFaceResponse = {
        status: 'error',
        message: error.message || 'Face authentication failed',
      };
      this.logger.error(`Authentication failed: ${JSON.stringify(errorResponse)}`);
      return errorResponse;
    }
  }

  private async createAttendanceSnapshot(input: {
    actorType: AttendanceActorType;
    examSessionId?: string;
    examPartCode?: string;
    capturedUserId?: string;
    matchedUserId?: string;
    status: AttendanceSnapshotStatus;
    confidence?: number;
    imageBuffer: Buffer;
    captureTimestamp: Date;
  }): Promise<void> {
    if (!input.examSessionId) {
      return;
    }

    try {
      const snapshot = await this.prisma.attendanceSnapshot.create({
        data: {
          actorType: input.actorType,
          examSessionId: input.examSessionId,
          examPartCode: input.examPartCode,
          capturedUserId: input.capturedUserId,
          matchedUserId: input.matchedUserId,
          status: input.status,
          confidence: input.confidence,
          captureTimestamp: input.captureTimestamp,
        },
      });

      const payload: AttendanceSnapshotUploadJobData = {
        snapshotId: snapshot.id,
        imageBase64: input.imageBuffer.toString('base64'),
        actorType: input.actorType,
        capturedAt: input.captureTimestamp.toISOString(),
      };

      this.examClient.emit(
        MESSAGE_PATTERNS.EXAM.UPLOAD_ATTENDANCE_SNAPSHOT,
        payload,
      );
    } catch (error) {
      this.logger.error(
        `Failed to persist attendance snapshot for session ${input.examSessionId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
