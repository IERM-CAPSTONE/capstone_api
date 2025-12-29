import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppBackgroundModule } from './app_background.module';

async function bootstrap() {
  const logger = new Logger('BackgroundWorker');

  const app = await NestFactory.create(AppBackgroundModule);

  // Background worker không cần HTTP server, nhưng NestJS yêu cầu
  // Listen trên port khác để tránh conflict với app_api
  const port = process.env.BACKGROUND_PORT ?? 3001;
  await app.listen(port);

  logger.log(`🚀 Background worker is running on port ${port}`);
  logger.log(`📋 Listening for jobs from Redis queue...`);
}

bootstrap();
