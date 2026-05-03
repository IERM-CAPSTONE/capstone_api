import { Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { DownloadAutoGenerateTemplatesHandler } from './download-auto-generate-templates.handler';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { Roles } from '../../../../common/decorators';
import { RoleType } from '@app/users';

@ApiTags('Exam Sessions')
@ApiBearerAuth()
@Controller('exam-sessions/templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
export class DownloadAutoGenerateTemplatesEndpoint {
    constructor(private readonly handler: DownloadAutoGenerateTemplatesHandler) { }

    @Get(':type')
    @ApiOperation({ summary: 'Download auto-generate templates' })
    @ApiResponse({ status: 200, description: 'Template file generated' })
    async execute(
        @Param('type') type: 'proctor' | 'registration' | 'course',
        @Res() res: Response
    ) {
        return this.handler.execute(type, res);
    }
}
