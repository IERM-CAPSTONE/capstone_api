import { Controller, Logger } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { MESSAGE_PATTERNS, EmailJobData, BaseJobResult } from '@app/queue';

/**
 * EmailProcessor - Xử lý các message từ email queue
 */
@Controller()
export class EmailProcessor {
    private readonly logger = new Logger(EmailProcessor.name);

    /**
     * Xử lý gửi email xác nhận
     */
    @MessagePattern(MESSAGE_PATTERNS.EMAIL.SEND_CONFIRMATION)
    async handleSendConfirmation(
        @Payload() data: EmailJobData,
        @Ctx() context: RmqContext,
    ): Promise<BaseJobResult> {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        const startTime = Date.now();

        this.logger.log(`📧 Processing confirmation email to: ${data.to}`);

        try {
            // TODO: Implement actual email sending logic
            // Example: await this.emailService.sendConfirmation(data);

            this.logger.log(`✅ Confirmation email sent to: ${data.to}`);

            // Acknowledge the message
            channel.ack(originalMsg);

            return {
                jobId: originalMsg.properties.messageId || 'unknown',
                success: true,
                processingTime: Date.now() - startTime,
                completedAt: new Date(),
            };
        } catch (error) {
            this.logger.error(`❌ Failed to send confirmation email: ${error.message}`);

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
     * Xử lý gửi email thông báo
     */
    @MessagePattern(MESSAGE_PATTERNS.EMAIL.SEND_ALERT)
    async handleSendAlert(
        @Payload() data: EmailJobData,
        @Ctx() context: RmqContext,
    ): Promise<BaseJobResult> {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();
        const startTime = Date.now();

        this.logger.log(`🚨 Processing alert email to: ${data.to}`);

        try {
            // TODO: Implement actual email sending logic
            // Example: await this.emailService.sendAlert(data);

            this.logger.log(`✅ Alert email sent to: ${data.to}`);

            // Acknowledge the message
            channel.ack(originalMsg);

            return {
                jobId: originalMsg.properties.messageId || 'unknown',
                success: true,
                processingTime: Date.now() - startTime,
                completedAt: new Date(),
            };
        } catch (error) {
            this.logger.error(`❌ Failed to send alert email: ${error.message}`);

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
