import { Controller, Logger } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { MESSAGE_PATTERNS, AttendanceSnapshotUploadJobData } from '@app/queue';
import { PrismaService } from '@app/prisma';
import { CloudinaryService } from '../../../../../app_api/src/common/cloudinary/cloudinary.service';

@Controller()
export class AttendanceSnapshotProcessor {
  private readonly logger = new Logger(AttendanceSnapshotProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @MessagePattern(MESSAGE_PATTERNS.EXAM.UPLOAD_ATTENDANCE_SNAPSHOT)
  async handleUploadAttendanceSnapshot(
    @Payload() data: AttendanceSnapshotUploadJobData,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();

    try {
      const folderPrefix =
        data.actorType === 'PROCTOR'
          ? 'attendance/proctor'
          : 'attendance/student';

      const imageUrl = await this.cloudinaryService.uploadImage(
        Buffer.from(data.imageBase64, 'base64'),
        folderPrefix,
      );

      await this.prisma.attendanceSnapshot.update({
        where: { id: data.snapshotId },
        data: { imageUrl },
      });

      channel.ack(originalMsg);
    } catch (error) {
      this.logger.error(
        `Failed to upload attendance snapshot ${data.snapshotId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      channel.nack(originalMsg, false, true);
    }
  }
}
