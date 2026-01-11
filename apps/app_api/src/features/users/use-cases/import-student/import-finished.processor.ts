import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload, Ctx, RmqContext } from '@nestjs/microservices';
import { MESSAGE_PATTERNS, UserImportFinishedData } from '@app/queue';
import { NotificationGateway } from '../../../../common/gateways/notification.gateway';

@Controller()
export class ImportFinishedProcessor {
    private readonly logger = new Logger(ImportFinishedProcessor.name);

    constructor(private readonly notificationGateway: NotificationGateway) { }

    @MessagePattern(MESSAGE_PATTERNS.USER.IMPORT_FINISHED)
    async handleImportFinished(
        @Payload() data: UserImportFinishedData,
        @Ctx() context: RmqContext
    ) {
        const channel = context.getChannelRef();
        const originalMsg = context.getMessage();

        this.logger.log(`Received import finished event for: ${data.fileName}`);

        // Push to WebSocket
        this.notificationGateway.sendToAll('IMPORT_COMPLETED', {
            message: `Import file ${data.fileName} completed!`,
            success: data.successCount,
            errors: data.errorCount,
            timestamp: data.timestamp,
        });

        this.logger.log(`Pushed notification to WebSocket for: ${data.fileName}`);

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
