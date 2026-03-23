import {
    Controller,
    Put,
    Body,
    Param,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { Roles } from '../../../../common/decorators';
import { RoleType } from '@app/users';
import { UpdateTemplateHandler } from './update-template.handler';
import { AnnouncementType } from '@prisma/client';

export class UpdateTemplateDto {
    title?: string;
    content?: string;
    type?: AnnouncementType;
}

@ApiTags('Announcement Templates')
@ApiBearerAuth('JWT-auth')
@Controller('announcement-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UpdateTemplateEndpoint {
    constructor(private readonly handler: UpdateTemplateHandler) { }

    @Put(':id')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Update an announcement template (Admin & Officer)' })
    @ApiResponse({ status: 200, description: 'Template updated successfully' })
    async handle(@Param('id') id: string, @Body() dto: UpdateTemplateDto) {
        return await this.handler.execute({ id, ...dto });
    }
}
