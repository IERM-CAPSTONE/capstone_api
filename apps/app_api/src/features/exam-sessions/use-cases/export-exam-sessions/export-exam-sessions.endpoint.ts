import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportExamSessionsHandler } from './export-exam-sessions.handler';
import { ExportExamSessionsDto } from './export-exam-sessions.dto';

@ApiTags('Exam Sessions')
@ApiBearerAuth()
@Controller('exam-sessions/export')
export class ExportExamSessionsEndpoint {
    constructor(private readonly handler: ExportExamSessionsHandler) { }

    @Get()
    @ApiOperation({ summary: 'Export exam schedules and results to Excel' })
    @ApiResponse({ status: 200, description: 'File generated' })
    async execute(
        @Query() dto: ExportExamSessionsDto,
        @Res() res: Response
    ) {
        return this.handler.execute(dto, res);
    }
}
