import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppApiModule } from './app_api.module';

async function bootstrap() {
  const logger = new Logger('API');

  const app = await NestFactory.create(AppApiModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS
  app.enableCors();

  const port = process.env.API_PORT ?? 3000;
  await app.listen(port);

  logger.log(`🚀 API server is running on http://localhost:${port}`);
}

bootstrap();
