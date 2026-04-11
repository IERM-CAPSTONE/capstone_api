import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import {
  SearchAuditLogEndpoint,
  SearchAuditLogHandler,
} from './use-cases/search-audit-log';

@Module({
  imports: [PrismaModule],
  controllers: [SearchAuditLogEndpoint],
  providers: [SearchAuditLogHandler],
})
export class AuditLogModule {}
