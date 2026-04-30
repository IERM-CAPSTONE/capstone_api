import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('Prisma');
  private pool: Pool;
  private readonly enableQueryLogging: boolean;

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    const enableQueryLogging = process.env.PRISMA_LOG_QUERIES === 'true';
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);

    const prismaLog: any[] = [
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
    ];

    if (enableQueryLogging) {
      prismaLog.push({ emit: 'event', level: 'query' });
    }

    super({
      adapter,
      log: prismaLog,
    });

    this.pool = pool;
    this.enableQueryLogging = enableQueryLogging;

    this.$on('error' as never, (event: any) => {
      this.logger.error(`[PrismaError] ${event?.message ?? 'Unknown Prisma error'}${event?.target ? ` | target=${event.target}` : ''}`);
    });

    this.$on('warn' as never, (event: any) => {
      this.logger.warn(`[PrismaWarn] ${event?.message ?? 'Unknown Prisma warning'}${event?.target ? ` | target=${event.target}` : ''}`);
    });

    if (enableQueryLogging) {
      this.$on('query' as never, (event: any) => {
        this.logger.debug(`[PrismaQuery] ${event?.duration ?? '?'}ms | ${event?.target ?? 'unknown target'} | ${event?.query ?? ''}`);
      });
    }
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log(`Prisma connected successfully to: ${process.env.DATABASE_URL?.split('@')[1]}`);
      if (this.enableQueryLogging) {
        this.logger.warn('PRISMA_LOG_QUERIES=true: query logging is enabled and may include sensitive query data.');
      }
    } catch (error) {
      this.logger.error(`Prisma connection failed: ${(error as Error)?.message ?? error}`);
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