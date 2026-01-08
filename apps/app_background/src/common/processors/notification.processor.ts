import { Controller, Logger } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { MESSAGE_PATTERNS, NotificationJobData, BaseJobResult } from '@app/queue';

/**
 * NotificationProcessor - Xử lý các message từ notification queue
 */
@Controller()
export class NotificationProcessor {
    private readonly logger = new Logger(NotificationProcessor.name);

    /**
     * Xử lý gửi push notification
     */
    @MessagePattern(MESSAGE_PATTERNS.NOTIFICATION.SEND_PUSH)
    async handleSendPush(
        @Payload() data: NotificationJobData,
        @Ctx() context: RmqContext,
    ): Promise<BaseJobResult> {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        const startTime = Date.now();

        this.logger.log(`📱 Processing push notification for user: ${data.userId}`);

        try {
            // TODO: Implement actual push notification logic
            // Example: await this.pushService.send(data);

            this.logger.log(`✅ Push notification sent successfully to user: ${data.userId}`);

            // Acknowledge the message
            channel.ack(originalMsg);

            return {
                jobId: originalMsg.properties.messageId || 'unknown',
                success: true,
                processingTime: Date.now() - startTime,
                completedAt: new Date(),
            };
        } catch (error) {
            this.logger.error(`❌ Failed to send push notification: ${error.message}`);

            // Reject and requeue the message
            channel.nack(originalMsg, false, true);

            return {
                jobId: originalMsg.properties.messageId || 'unknown',
                success: false,
                processingTime: Date.now() - startTime,
                error: error.message,
                completedAt: new Date(),
            };
        }
    }

    /**
     * Xử lý gửi in-app notification
     */
    @MessagePattern(MESSAGE_PATTERNS.NOTIFICATION.SEND_IN_APP)
    async handleSendInApp(
        @Payload() data: NotificationJobData,
        @Ctx() context: RmqContext,
    ): Promise<BaseJobResult> {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        const startTime = Date.now();

        this.logger.log(`🔔 Processing in-app notification for user: ${data.userId}`);

        try {
            // TODO: Implement actual in-app notification logic
            // Example: await this.inAppService.create(data);

            this.logger.log(`✅ In-app notification created for user: ${data.userId}`);

            // Acknowledge the message
            channel.ack(originalMsg);

            return {
                jobId: originalMsg.properties.messageId || 'unknown',
                success: true,
                processingTime: Date.now() - startTime,
                completedAt: new Date(),
            };
        } catch (error) {
            this.logger.error(`❌ Failed to create in-app notification: ${error.message}`);

            // Reject and requeue the message
            channel.nack(originalMsg, false, true);

            return {
                jobId: originalMsg.properties.messageId || 'unknown',
                success: false,
                processingTime: Date.now() - startTime,
                error: error.message,
                completedAt: new Date(),
            };
        }
    }
}
