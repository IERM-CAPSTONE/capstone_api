import { Module } from '@nestjs/common';
import { PrismaModule } from 'libs/prisma/prisma.module';
import { ListNotificationsEndpoint } from './use-cases/list-notifications/list-notifications.endpoint';
import { ListNotificationsHandler } from './use-cases/list-notifications/list-notifications.handler';
import { MarkNotificationReadEndpoint } from './use-cases/mark-notification-read/mark-notification-read.endpoint';

@Module({
    imports: [PrismaModule],
    controllers: [ListNotificationsEndpoint, MarkNotificationReadEndpoint],
    providers: [ListNotificationsHandler],
})
export class NotificationsModule {}
