import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { lastValueFrom, timeout } from 'rxjs';
import {
  RABBITMQ_CLIENTS,
  MESSAGE_PATTERNS,
} from '@app/queue/queue.constants';
import { EncryptionUtils } from '@app/queue/encryption.utils';
import { RegisterFaceDto } from './register-face.dto';

export interface RegisterFaceResponse {
  status: 'success' | 'error';
  message: string;
  data?: {
    uid?: number;
    embeddings_count?: number;
  };
}

@Injectable()
export class RegisterFaceHandler {
  private readonly logger = new Logger(RegisterFaceHandler.name);
  private readonly encryptionKey: string;
  private readonly requestTimeout = 30000; // 30 seconds

  constructor(
    @Inject(RABBITMQ_CLIENTS.FACE_RECOGNITION_SERVICE)
    private readonly faceClient: ClientProxy,
    private readonly configService: ConfigService,
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

  async execute(dto: RegisterFaceDto): Promise<RegisterFaceResponse> {
    this.logger.log(`Processing face registration for student: ${dto.studentId}`);

    try {
      // Validation
      if (!dto.studentId || dto.studentId.trim() === '') {
        throw new Error('Student ID must not be empty');
      }

      if (!dto.encryptedImages || Object.keys(dto.encryptedImages).length === 0) {
        throw new Error('At least one image is required');
      }

      // Decrypt images if encrypted
      const decryptedImages: Record<string, Buffer> = {};

      if (dto.isEncrypted) {
        for (const [pose, encryptedData] of Object.entries(dto.encryptedImages)) {
          try {
            const decrypted = EncryptionUtils.decryptImage(
              encryptedData,
              this.encryptionKey,
            );

            // Verify hash if provided
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
            this.logger.error(`Failed to decrypt image for pose ${pose}:`, error);
            throw new Error(`Decryption failed for pose: ${pose}`);
          }
        }
      } else {
        // Handle non-encrypted images
        for (const [pose, base64Data] of Object.entries(dto.encryptedImages)) {
          decryptedImages[pose] = Buffer.from(base64Data, 'base64');
        }
      }

      // Convert buffers to base64 for RabbitMQ transmission
      const base64Images: Record<string, string> = {};
      for (const [pose, buffer] of Object.entries(decryptedImages)) {
        base64Images[pose] = buffer.toString('base64');
      }

      // Send to RabbitMQ (Python worker)
      const payload = {
        studentId: dto.studentId,
        images: base64Images,
        timestamp: new Date().toISOString(),
      };

      this.logger.log(`Sending registration request to RabbitMQ for student: ${dto.studentId}`);

      // Send message and wait for response
      const result$ = this.faceClient
        .send(MESSAGE_PATTERNS.FACE.REGISTER, payload)
        .pipe(timeout(this.requestTimeout));

      const result = await lastValueFrom(result$);

      this.logger.log(`Registration completed for student: ${dto.studentId}`);
      
      return {
        status: 'success',
        message: 'Face registered successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error('Face registration failed:', error);
      
      return {
        status: 'error',
        message: error.message || 'Face registration failed',
      };
    }
  }
}
