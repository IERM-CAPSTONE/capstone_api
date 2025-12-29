import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueModule } from '@app/queue';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // Queue module (Consumer)
    QueueModule.forRoot(),
    // TODO: Add your processor modules here
  ],
})
export class AppBackgroundModule { }
