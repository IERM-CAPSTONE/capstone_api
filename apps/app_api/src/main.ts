import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables only if not already provided by the environment (e.g., Docker)
if (!process.env.DATABASE_URL) {
  const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
  dotenv.config({ path: path.join(process.cwd(), envFile) });
}

import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppApiModule } from './app_api.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { QUEUE_NAMES, QUEUE_OPTIONS } from '@app/queue';

async function bootstrap() {
  const logger = new Logger('API');

  const app = await NestFactory.create(AppApiModule);

  app.use(cookieParser());

  // Use global exception filter
  app.useGlobalFilters(new AllExceptionsFilter(app.get(HttpAdapterHost)));

  // Global response interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS with credentials support
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Set global prefix for all routes (exclude Swagger docs)
  app.setGlobalPrefix('api', {
    exclude: ['docs', 'docs/(.*)'],
  });

  // Swagger/OpenAPI Configuration
  const config = new DocumentBuilder()
    .setTitle('Capstone API')
    .setDescription('API documentation for Exam Proctoring System')
    .setVersion('1.0')
    .addTag('Users', 'User management endpoints')
    .addTag('Auth', 'Authentication endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() in your controllers
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Capstone API Docs',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  // RabbitMQ Connection (Hybrid App)
  const configService = app.get(ConfigService);
  const rabbitmqUrl = configService.get<string>('RABBITMQ_URL', 'amqp://admin:admin123@localhost:5672');

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [rabbitmqUrl],
      queue: QUEUE_NAMES.API_EVENT,
      queueOptions: {
        durable: QUEUE_OPTIONS.DURABLE,
      },
      prefetchCount: QUEUE_OPTIONS.PREFETCH_COUNT,
      noAck: false,
    },
  });

  await app.startAllMicroservices();
  const port = process.env.API_PORT ?? 3000;
  await app.listen(port);

  logger.log(`API server is running on http://localhost:${port}`);
  logger.log(`Swagger documentation is available at http://localhost:${port}/docs`);
}

bootstrap();
