import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBITMQ_CLIENTS, MESSAGE_PATTERNS, NotificationJobData, EmailJobData } from '@app/queue';

/**
 * QueueService - Service để gửi messages đến RabbitMQ
 * Sử dụng trong app_api để đẩy jobs vào queue
 */
@Injectable()
export class QueueService implements OnModuleInit {
    private readonly logger = new Logger(QueueService.name);

    constructor(
        @Inject(RABBITMQ_CLIENTS.NOTIFICATION_SERVICE)
        private readonly notificationClient: ClientProxy,
        @Inject(RABBITMQ_CLIENTS.EMAIL_SERVICE)
        private readonly emailClient: ClientProxy,
    ) { }

    async onModuleInit() {
        // Connect to RabbitMQ on module initialization
        await this.notificationClient.connect();
        await this.emailClient.connect();
        this.logger.log('🐰 Connected to RabbitMQ');
    }

    // ==================== NOTIFICATION METHODS ====================

    /**
     * Gửi push notification
     */
    async sendPushNotification(data: NotificationJobData): Promise<void> {
        this.logger.log(`📱 Sending push notification to queue for user: ${data.userId}`);
        this.notificationClient.emit(MESSAGE_PATTERNS.NOTIFICATION.SEND_PUSH, data);
    }

    /**
     * Gửi in-app notification
     */
    async sendInAppNotification(data: NotificationJobData): Promise<void> {
        this.logger.log(`🔔 Sending in-app notification to queue for user: ${data.userId}`);
        this.notificationClient.emit(MESSAGE_PATTERNS.NOTIFICATION.SEND_IN_APP, data);
    }

    /**
     * Gửi notification (tự động chọn loại dựa trên type)
     */
    async sendNotification(data: NotificationJobData): Promise<void> {
        switch (data.type) {
            case 'push':
                await this.sendPushNotification(data);
                break;
            case 'in-app':
                await this.sendInAppNotification(data);
                break;
            case 'both':
                await this.sendPushNotification(data);
                await this.sendInAppNotification(data);
                break;
        }
    }

    // ==================== EMAIL METHODS ====================

    /**
     * Gửi confirmation email
     */
    async sendConfirmationEmail(data: EmailJobData): Promise<void> {
        this.logger.log(`📧 Sending confirmation email to queue for: ${data.to}`);
        this.emailClient.emit(MESSAGE_PATTERNS.EMAIL.SEND_CONFIRMATION, data);
    }

    /**
     * Gửi alert email
     */
    async sendAlertEmail(data: EmailJobData): Promise<void> {
        this.logger.log(`🚨 Sending alert email to queue for: ${data.to}`);
        this.emailClient.emit(MESSAGE_PATTERNS.EMAIL.SEND_ALERT, data);
    }
}
