import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ImportScheduleDto } from './import-schedule.dto';
import { ImportScheduleHandler } from './import-schedule.handler';

@ApiTags('Exam Sessions')
@Controller('exam-sessions')
export class ImportScheduleEndpoint {
    constructor(private readonly handler: ImportScheduleHandler) { }

    @Post('import-schedule')
    @ApiOperation({ summary: 'Import exam schedule and students mixed payload' })
    @ApiResponse({ status: 202, description: 'Import job accepted' })
    async import(@Body() dto: ImportScheduleDto) {
        return this.handler.handle(dto);
    }
}
