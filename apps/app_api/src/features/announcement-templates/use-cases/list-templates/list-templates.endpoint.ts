import {
    Controller,
    Get,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { Roles } from '../../../../common/decorators';
import { RoleType } from '@app/users';
import { ListTemplatesHandler } from './list-templates.handler';

@ApiTags('Announcement Templates')
@ApiBearerAuth('JWT-auth')
@Controller('announcement-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ListTemplatesEndpoint {
    constructor(private readonly handler: ListTemplatesHandler) { }

    @Get()
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER, RoleType.PROCTOR, RoleType.HALL_INVIGILATOR)
    @ApiOperation({ summary: 'Get all announcement templates (Authenticated Roles)' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by title or content' })
    @ApiResponse({ status: 200, description: 'List of templates' })
    async handle(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('search') search?: string,
    ) {
        return await this.handler.execute({ page, limit, search });
    }
}
