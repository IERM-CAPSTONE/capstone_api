import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from 'libs/prisma/prisma.module';
import { QueueModule } from '@app/queue';
import { HttpLoggerMiddleware } from './common/middleware';

// Feature Modules (Vertical Slice)
import { UsersModule } from './features/users';
import { ExamRoomsModule } from './features/exam-rooms';
import { ExamSessionsModule } from './features/exam-sessions';
import { StudentExamsModule } from './features/student-exams';
import { AppExamSeatsModule } from './features/exam-seats/exam-seats.module';
import { FaceRecognitionModule } from './features/face-recognition';
import { ProctorApplicationsModule } from './features/proctor-applications';
import { AppCacheModule } from '@app/cache';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        '.env',
        process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development',
      ],
    }),
    // Prisma for database access
    PrismaModule,
    // Queue module (Producer - for sending messages)
    QueueModule.forRoot(),
    // Cache module
    AppCacheModule,
    // Feature Modules
    UsersModule,
    ExamRoomsModule,
    ExamSessionsModule,
    StudentExamsModule,
    AppExamSeatsModule,
    FaceRecognitionModule,
    ProctorApplicationsModule,
  ],
  providers: [],
  exports: [],
})
export class AppApiModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(HttpLoggerMiddleware)
      .forRoutes('*');
  }
}
