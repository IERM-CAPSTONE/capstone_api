import { Module } from '@nestjs/common';
import { PrismaModule } from 'libs/prisma/prisma.module';
@Module({
  imports: [PrismaModule],
})
export class AppApiModule { }
