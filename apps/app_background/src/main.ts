import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables only if not already provided by the environment (e.g., Docker)
if (!process.env.DATABASE_URL) {
  const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
  dotenv.config({ path: path.join(process.cwd(), envFile) });
}

import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { AppBackgroundModule } from './app_background.module';
import { QUEUE_NAMES, QUEUE_OPTIONS } from '@app/queue';

async function bootstrap() {
  const logger = new Logger('BackgroundWorker');

  // 1. Create a single application instance
  // We use create() instead of createMicroservice() to allow multiple microservice connections (Hybrid App pattern)
  const app = await NestFactory.create(AppBackgroundModule);

  const configService = app.get(ConfigService);
  const rabbitmqUrl = configService.get<string>('RABBITMQ_URL', 'amqp://admin:admin123@localhost:5672');

  // 2. Define the queues we want to listen to
  const queues = [
    QUEUE_NAMES.USER
  ];

  // 3. Connect each queue as a microservice to the same app instance
  for (const queueName of queues) {
    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [rabbitmqUrl],
        queue: queueName,
        queueOptions: {
          durable: QUEUE_OPTIONS.DURABLE,
        },
        prefetchCount: QUEUE_OPTIONS.PREFETCH_COUNT,
        noAck: false,
      },
    });
    logger.log(`󱗚 Registered listener for queue: ${queueName}`);
  }

  // 4. Start all connected microservices
  await app.startAllMicroservices();

  // 5. Start the main app (can be used for health checks on a different port)
  const port = process.env.BACKGROUND_PORT || 3001;
  await app.listen(port);

  logger.log(`󱗚 Background worker is running on port ${port}`);
  logger.log(`󰄬 Monitoring queues: ${queues.join(', ')}`);
}

bootstrap();
