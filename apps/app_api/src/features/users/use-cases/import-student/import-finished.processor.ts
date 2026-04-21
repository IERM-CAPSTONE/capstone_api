import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { MESSAGE_PATTERNS, UserImportFinishedData } from '@app/queue';
import { NotificationGateway } from '../../../../common/gateways/notification.gateway';

@Controller()
export class ImportFinishedProcessor {
    private readonly logger = new Logger(ImportFinishedProcessor.name);

    constructor(private readonly notificationGateway: NotificationGateway) { }

    @MessagePattern(MESSAGE_PATTERNS.USER.IMPORT_FINISHED)
    async handleUserImportFinished(
        @Payload() data: UserImportFinishedData,
        @Ctx() context: RmqContext
    ) {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();

        this.logger.log(`Received user import finished event for: ${data.fileName}`);

        // Push to WebSocket
        this.notificationGateway.sendToAll('IMPORT_COMPLETED', {
            action: 'users',
            message: `Import file ${data.fileName} completed!`,
            successCount: data.successCount,
            errorCount: data.errorCount,
            batchId: data.batchId,
            failedItems: data.failedItems,
            timestamp: data.timestamp,
        });

        this.logger.log(`Pushed user notification to WebSocket for: ${data.fileName}`);

        // Manual acknowledge
        channel.ack(originalMsg);
    }

    @MessagePattern(MESSAGE_PATTERNS.EXAM.IMPORT_FINISHED)
    async handleExamImportFinished(
        @Payload() data: any,
        @Ctx() context: RmqContext
    ) {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();

        this.logger.log(`Received exam import finished event for: ${data.action} - ${data.fileName}`);

        // Push to WebSocket
        this.notificationGateway.sendToAll('IMPORT_COMPLETED', {
            action: data.action,
            message: `Import ${data.action} completed!`,
            successCount: data.successCount,
            errorCount: data.errorCount,
            batchId: data.batchId,
            failedItems: data.failedItems,
            timestamp: data.timestamp,
            fileName: data.fileName
        });

        this.logger.log(`Pushed exam notification to WebSocket for: ${data.action}`);

        // Manual acknowledge
        channel.ack(originalMsg);
    }

    @MessagePattern(MESSAGE_PATTERNS.EXAM.AUTO_GENERATE_CALCULATED)
    async handleAutoGenerateCalculated(
        @Payload() data: any,
        @Ctx() context: RmqContext
    ) {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();

        this.logger.log(`Received auto-generate calculated event...`);

        // Push to WebSocket
        this.notificationGateway.sendToAll('AUTO_GENERATE_CALCULATED', data);

        // Manual acknowledge
        channel.ack(originalMsg);
    }

    @MessagePattern(MESSAGE_PATTERNS.EXAM.AUTO_GENERATE_FINISHED)
    async handleAutoGenerateFinished(
        @Payload() data: any,
        @Ctx() context: RmqContext
    ) {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();

        this.logger.log(`Received auto-generate finished event for semester: ${data.semesterId}`);

        // Push to WebSocket
        this.notificationGateway.sendToAll('AUTO_GENERATE_COMPLETED', {
            semesterId: data.semesterId,
            message: `Auto-generation for semester completed!`,
            sessionCount: data.sessionCount,
            campuses: data.campuses,
            timestamp: new Date().toISOString(),
        });

        this.logger.log(`Pushed auto-generate notification to WebSocket`);

        // Manual acknowledge
        channel.ack(originalMsg);
    }

    @MessagePattern(MESSAGE_PATTERNS.USER.ACTIVITY_LOGGED)
    async handleActivityLogged(
        @Payload() data: any,
        @Ctx() context: RmqContext
    ) {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();

        this.logger.debug(`Received activity logged event for: ${data.userName}`);

        // Push to WebSocket
        this.notificationGateway.sendToAll('ACCOUNT_ACTIVITY', data);

        // Manual acknowledge
        channel.ack(originalMsg);
    }
}
