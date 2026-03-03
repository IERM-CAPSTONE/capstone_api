import {
    Controller,
    Get,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards';
import { ExamTypeResponse } from '../../shared/exam-type.response';
import { ListExamTypesHandler } from './list-exam-types.handler';

@ApiTags('ExamTypes')
@ApiBearerAuth('JWT-auth')
@Controller('exam-types')
@UseGuards(JwtAuthGuard)
export class ListExamTypesEndpoint {
    constructor(private readonly handler: ListExamTypesHandler) { }

    @Get()
    @ApiOperation({ summary: 'Get all exam types' })
    @ApiResponse({ status: 200, description: 'List of exam types', type: [ExamTypeResponse] })
    async handle(): Promise<ExamTypeResponse[]> {
        return await this.handler.execute();
    }
}
