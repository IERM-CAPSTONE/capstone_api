import {
    Controller,
    Get,
    Param,
    NotFoundException,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards';
import { SubjectResponse } from '../../shared/subject.response';
import { GetSubjectHandler } from './get-subject.handler';

@ApiTags('Subjects')
@ApiBearerAuth('JWT-auth')
@Controller('subjects')
@UseGuards(JwtAuthGuard)
export class GetSubjectEndpoint {
    constructor(private readonly handler: GetSubjectHandler) { }

    @Get(':id')
    @ApiOperation({ summary: 'Get a subject by ID' })
    @ApiResponse({ status: 200, description: 'Subject details', type: SubjectResponse })
    @ApiResponse({ status: 404, description: 'Subject not found' })
    async handle(@Param('id') id: string): Promise<SubjectResponse> {
        try {
            return await this.handler.execute(id);
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            throw error;
        }
    }
}
