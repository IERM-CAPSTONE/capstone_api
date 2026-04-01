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
import { AppExamPartsModule } from './features/exam-parts';
import { AppSubjectsModule } from './features/subjects';
import { SemestersModule } from './features/semesters/semesters.module';
import { AppCacheModule } from '@app/cache';
import { DevicesModule } from './features/devices';
import { DeviceApplicationsModule } from './features/device-applications';
import { TicketsCoreModule } from '@app/tickets';
import { TicketsModule } from './features/tickets/tickets.module';
import { AnnouncementTemplatesModule } from './features/announcement-templates/announcement-templates.module';
import { CloudinaryModule } from './common/cloudinary/cloudinary.module';
import { NotificationsModule } from './features/notifications/notifications.module';
import { AttendanceLogsModule } from './features/attendance-logs';

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
    AppExamPartsModule,
    AppSubjectsModule,
    SemestersModule,
    DevicesModule,
    DeviceApplicationsModule,
    TicketsCoreModule,
    TicketsModule,
    AnnouncementTemplatesModule,
    CloudinaryModule,
    NotificationsModule,
    AttendanceLogsModule,
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
