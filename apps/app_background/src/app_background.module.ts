import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NotificationProcessor } from './common/processors/notification.processor';
import { EmailProcessor } from './common/processors/email.processor';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'production'
        ? '.env.production'
        : '.env.development',
    }),
  ],
  controllers: [
    // RabbitMQ message handlers are controllers in microservices
    NotificationProcessor,
    EmailProcessor,
  ],
})
export class AppBackgroundModule { }
