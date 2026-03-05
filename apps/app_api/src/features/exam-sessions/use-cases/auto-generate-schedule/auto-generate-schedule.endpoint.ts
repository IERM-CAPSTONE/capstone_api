import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AutoGenerateScheduleHandler } from './auto-generate-schedule.handler';
import { AutoGenerateScheduleDto } from './auto-generate-schedule.dto';

@ApiTags('Exam Sessions')
@ApiBearerAuth()
@Controller('exam-sessions/auto-generate')
export class AutoGenerateScheduleEndpoint {
    constructor(private readonly handler: AutoGenerateScheduleHandler) { }

    @Post()
    @ApiOperation({ summary: 'Auto-generate exam schedule for a semester' })
    @ApiResponse({ status: 201, description: 'Job queued successfully' })
    async execute(@Body() dto: AutoGenerateScheduleDto) {
        return this.handler.execute(dto);
    }
}
