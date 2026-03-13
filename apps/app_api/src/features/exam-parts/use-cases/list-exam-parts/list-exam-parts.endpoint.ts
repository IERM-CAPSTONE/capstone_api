import {
    Controller,
    Get,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards';
import { ExamPartResponse } from '../../shared/exam-part.response';
import { ListExamPartsHandler } from './list-exam-parts.handler';

@ApiTags('ExamParts')
@ApiBearerAuth('JWT-auth')
@Controller('exam-parts')
@UseGuards(JwtAuthGuard)
export class ListExamPartsEndpoint {
    constructor(private readonly handler: ListExamPartsHandler) { }

    @Get()
    @ApiOperation({ summary: 'Get all exam types' })
    @ApiResponse({ status: 200, description: 'List of exam types', type: [ExamPartResponse] })
    async handle(): Promise<ExamPartResponse[]> {
        return await this.handler.execute();
    }
}
