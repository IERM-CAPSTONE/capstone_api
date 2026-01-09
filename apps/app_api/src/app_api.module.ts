import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'libs/prisma/prisma.module';
import { QueueModule } from '@app/queue';
import { HttpLoggerMiddleware } from './common/middleware';

// Feature Modules (Vertical Slice)
import { UsersModule } from './features/users';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: !!process.env.DATABASE_URL,
      envFilePath: process.env.NODE_ENV === 'production'
        ? '.env.production'
        : '.env.development',
    }),
    // Prisma for database access
    PrismaModule,
    // Queue module (Producer - for sending messages)
    QueueModule.forRoot(),
    // Feature Modules
    UsersModule,
  ],
  providers: [],
  exports: [],
})
export class AppApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(HttpLoggerMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
