import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables before anything else
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.join(process.cwd(), envFile) });

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AppBackgroundModule } from './app_background.module';
import { QUEUE_NAMES, QUEUE_OPTIONS } from '@app/queue';

async function bootstrap() {
  const logger = new Logger('BackgroundWorker');

  // Tạo app context để lấy ConfigService
  const appContext = await NestFactory.createApplicationContext(AppBackgroundModule);
  const configService = appContext.get(ConfigService);

  const rabbitmqUrl = configService.get<string>('RABBITMQ_URL', 'amqp://admin:admin123@localhost:5672');

  // Tạo microservice cho Notification Queue
  const notificationApp = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppBackgroundModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: QUEUE_NAMES.NOTIFICATION,
        queueOptions: {
          durable: QUEUE_OPTIONS.DURABLE,
        },
        prefetchCount: QUEUE_OPTIONS.PREFETCH_COUNT,
        noAck: false,
      },
    },
  );

  // Tạo microservice cho Email Queue
  const emailApp = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppBackgroundModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: QUEUE_NAMES.EMAIL,
        queueOptions: {
          durable: QUEUE_OPTIONS.DURABLE,
        },
        prefetchCount: QUEUE_OPTIONS.PREFETCH_COUNT,
        noAck: false,
      },
    },
  );

  // Start all microservices
  await notificationApp.listen();
  await emailApp.listen();

  // Close the app context
  await appContext.close();

  logger.log(`🐰 Background worker connected to RabbitMQ`);
  logger.log(`📋 Listening on queues: ${QUEUE_NAMES.NOTIFICATION}, ${QUEUE_NAMES.EMAIL}`);
}

bootstrap();
