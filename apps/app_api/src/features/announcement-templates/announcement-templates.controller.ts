import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Query,
    Param,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { RoleType } from '@app/users';

import { 
    CreateTemplateDto, 
    UpdateTemplateDto 
} from './shared/announcement-template.dto';

import { ListTemplatesHandler } from './use-cases/list-templates/list-templates.handler';
import { CreateTemplateHandler } from './use-cases/create-template/create-template.handler';
import { UpdateTemplateHandler } from './use-cases/update-template/update-template.handler';
import { DeleteTemplateHandler } from './use-cases/delete-template/delete-template.handler';

@ApiTags('Announcement Templates')
@ApiBearerAuth('JWT-auth')
@Controller('announcement-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnnouncementTemplatesController {
    constructor(
        private readonly createHandler: CreateTemplateHandler,
        private readonly listHandler: ListTemplatesHandler,
        private readonly updateHandler: UpdateTemplateHandler,
        private readonly deleteHandler: DeleteTemplateHandler,
    ) { }

    @Post()
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Create a new announcement template (Admin & Officer)' })
    @ApiResponse({ status: 201, description: 'Created' })
    async create(@Body() dto: CreateTemplateDto) {
        return await this.createHandler.execute(dto);
    }

    @Get()
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER, RoleType.PROCTOR, RoleType.HALL_INVIGILATOR)
    @ApiOperation({ summary: 'Get all announcement templates' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'campus', required: false, type: String })
    async list(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('search') search?: string,
        @Query('campus') campus?: string,
    ) {
        return await this.listHandler.execute({ page, limit, search, campus });
    }

    @Put(':id')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Update an template' })
    async update(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
        return await this.updateHandler.execute({ id, ...dto });
    }

    @Delete(':id')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Delete an template' })
    async delete(@Param('id') id: string) {
        return await this.deleteHandler.execute({ id });
    }
}
