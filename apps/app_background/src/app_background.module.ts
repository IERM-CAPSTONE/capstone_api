import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StudentImportProcessor } from './features/users/processors/student-import.processor';
import { ExamBackgroundModule } from './features/exam/exam-background.module';
import { UsersCoreModule } from '@app/users';
import { QueueModule } from '@app/queue';
import { AppCacheModule } from '@app/cache';

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
    UsersCoreModule,
    ExamBackgroundModule,
    QueueModule.forRoot(),
    AppCacheModule,
  ],
  controllers: [
    // RabbitMQ message handlers are controllers in microservices
    StudentImportProcessor,
  ],
})
export class AppBackgroundModule { }
