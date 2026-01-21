import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: ['error', 'warn'],
    });

    this.pool = pool;
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Prisma connected successfully to:', process.env.DATABASE_URL?.split('@')[1]);
    } catch (error) {
      console.error('Prisma connection failed:', error);
      throw error;
    }
  }

  // call this after app boot to gracefully shut down when Prisma fires beforeExit
  //   async enableShutdownHooks(app: any) {
  //     this.$on('beforeExit', async () => {
  //       await app.close();
  //     });
  //   }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}