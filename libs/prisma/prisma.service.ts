import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  // call this after app boot to gracefully shut down when Prisma fires beforeExit
//   async enableShutdownHooks(app: any) {
//     this.$on('beforeExit', async () => {
//       await app.close();
//     });
//   }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}