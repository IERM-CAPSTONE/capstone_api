import {
    Controller,
    Get,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards';
import { SubjectPaginationResponse, SubjectResponse } from '../../shared/subject.response';
import { ListSubjectsHandler } from './list-subjects.handler';

@ApiTags('Subjects')
@ApiBearerAuth('JWT-auth')
@Controller('subjects')
@UseGuards(JwtAuthGuard)
export class ListSubjectsEndpoint {
    constructor(private readonly handler: ListSubjectsHandler) { }

    @Get()
    @ApiOperation({ summary: 'Get all subjects with pagination' })
    @ApiQuery({ name: 'semesterId', required: false })
    @ApiQuery({ name: 'department', required: false })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiResponse({ status: 200, description: 'Paginated list of subjects', type: SubjectPaginationResponse })
    async handle(
        @Query('semesterId') semesterId?: string,
        @Query('department') department?: string,
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('search') search?: string,
    ): Promise<SubjectPaginationResponse> {
        return await this.handler.execute({
            semesterId,
            department,
            page: Number(page),
            limit: Number(limit),
            search
        });
    }
}
