import {
    Controller,
    Get,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { Roles } from '../../../../common/decorators';
import { RoleType } from '@app/users';
import { SemesterPaginationResponse } from '../../shared/semester.response';
import { ListSemestersHandler } from './list-semesters.handler';

@ApiTags('Semesters')
@ApiBearerAuth('JWT-auth')
@Controller('semesters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ListSemestersEndpoint {
    constructor(private readonly handler: ListSemestersHandler) { }

    @Get()
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Get all semesters with pagination (Admin & Officer)' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by code or name' })
    @ApiQuery({ name: 'fromDate', required: false, type: String, description: 'Filter semesters ending after this date (ISO string)' })
    @ApiQuery({ name: 'toDate', required: false, type: String, description: 'Filter semesters starting before this date (ISO string)' })
    @ApiResponse({ status: 200, description: 'List of semesters', type: SemesterPaginationResponse })
    async handle(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 10,
        @Query('search') search?: string,
        @Query('fromDate') fromDate?: string,
        @Query('toDate') toDate?: string,
    ): Promise<SemesterPaginationResponse> {
        return await this.handler.execute({ page, limit, search, fromDate, toDate });
    }
}
