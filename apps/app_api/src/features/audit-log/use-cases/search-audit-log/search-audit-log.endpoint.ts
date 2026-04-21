import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { SearchAuditLogDto } from './search-audit-log.dto';
import { SearchAuditLogHandler } from './search-audit-log.handler';

@ApiTags('Audit Log')
@ApiBearerAuth('JWT-auth')
@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SearchAuditLogEndpoint {
  constructor(private readonly handler: SearchAuditLogHandler) {}

  @Get('search')
  @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
  @ApiOperation({ summary: 'Search tickets and attendance snapshots by student code or email' })
  @ApiQuery({ name: 'keyword', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Audit log search completed successfully' })
  async handle(@Query() query: SearchAuditLogDto) {
    return this.handler.execute(query);
  }
}
