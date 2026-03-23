import {
    Controller,
    Post,
    Body,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { Roles } from '../../../../common/decorators';
import { RoleType } from '@app/users';
import { CreateTemplateHandler, CreateTemplateCommand } from './create-template.handler';
import { AnnouncementType } from '@prisma/client';

export class CreateTemplateDto implements CreateTemplateCommand {
    title: string;
    content: string;
    type: AnnouncementType;
}

@ApiTags('Announcement Templates')
@ApiBearerAuth('JWT-auth')
@Controller('announcement-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CreateTemplateEndpoint {
    constructor(private readonly handler: CreateTemplateHandler) { }

    @Post()
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Create a new announcement template (Admin & Officer)' })
    @ApiResponse({ status: 201, description: 'The template has been successfully created.' })
    async handle(@Body() dto: CreateTemplateDto) {
        return await this.handler.execute(dto);
    }
}
