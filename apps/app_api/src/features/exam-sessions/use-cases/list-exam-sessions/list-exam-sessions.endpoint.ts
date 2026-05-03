import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards';
import { PaginatedExamSessionResponse } from '../../shared/exam-session.response';
import { ListExamSessionsDto } from './list-exam-sessions.dto';
import { ListExamSessionsHandler } from './list-exam-sessions.handler';

@ApiTags('ExamSessions')
@ApiBearerAuth('JWT-auth')
@Controller('exam-sessions')
@UseGuards(JwtAuthGuard)
export class ListExamSessionsEndpoint {
    constructor(private readonly handler: ListExamSessionsHandler) { }

    @Get()
    @ApiOperation({ summary: 'List exam sessions with pagination' })
    @ApiResponse({ status: 200, type: PaginatedExamSessionResponse })
    async handle(@Query() dto: ListExamSessionsDto, @Req() req: any): Promise<PaginatedExamSessionResponse> {
        return await this.handler.execute(dto, req.user);
    }
}
