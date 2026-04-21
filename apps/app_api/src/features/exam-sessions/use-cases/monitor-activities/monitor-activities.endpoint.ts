import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards';
import { MonitorActivitiesHandler } from './monitor-activities.handler';
import { MonitorActivitiesQueryDto, SessionActivityItem } from './monitor-activities.dto';

@ApiTags('Exam Sessions')
@ApiBearerAuth('JWT-auth')
@Controller('exam-sessions')
@UseGuards(JwtAuthGuard)
export class MonitorActivitiesEndpoint {
    constructor(private readonly handler: MonitorActivitiesHandler) {}

    @Get(':sessionId/monitor-activities')
    @ApiOperation({ summary: 'Get monitor activity history for one exam session' })
    @ApiResponse({ status: 200, description: 'Session activity history returned' })
    async execute(
        @Param('sessionId') sessionId: string,
        @Query() query: MonitorActivitiesQueryDto,
    ): Promise<SessionActivityItem[]> {
        return this.handler.execute(sessionId, query);
    }
}
