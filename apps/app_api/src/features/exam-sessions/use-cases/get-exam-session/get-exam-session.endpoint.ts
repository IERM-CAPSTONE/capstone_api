import { Controller, Get, Param, UseGuards, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards';
import { ExamSessionResponse } from '../../shared/exam-session.response';
import { GetExamSessionHandler } from './get-exam-session.handler';

@ApiTags('ExamSessions')
@ApiBearerAuth('JWT-auth')
@Controller('exam-sessions')
@UseGuards(JwtAuthGuard)
export class GetExamSessionEndpoint {
    constructor(private readonly handler: GetExamSessionHandler) { }

    @Get(':id')
    @ApiOperation({ summary: 'Get an exam session by id' })
    @ApiResponse({ status: 200, type: ExamSessionResponse })
    async handle(@Param('id') id: string): Promise<ExamSessionResponse> {
        try {
            return await this.handler.execute(id);
        } catch (error) {
            throw new NotFoundException(error.message);
        }
    }
}
