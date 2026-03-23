import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { MonitorSummaryHandler } from './monitor-summary.handler';
import { MonitorSummaryQueryDto } from './monitor-summary.dto';
import { SubjectMonitorSummary } from '@app/exam-sessions';
import { JwtAuthGuard } from '../../../../common/guards';

@ApiTags('Exam Sessions')
@Controller('exam-sessions')
@UseGuards(JwtAuthGuard)
export class MonitorSummaryEndpoint {
    constructor(private readonly handler: MonitorSummaryHandler) { }

    @Get('monitor-summary')
    @ApiOperation({ summary: 'Get summary of exam sessions for monitoring' })
    @ApiResponse({ status: 200, description: 'Return aggregated summary by subject' })
    async execute(@Req() req: any, @Query() query: MonitorSummaryQueryDto): Promise<SubjectMonitorSummary[]> {
        if (req.user?.campus) {
            query.campus = req.user.campus;
        }
        return this.handler.execute(query);
    }
}
