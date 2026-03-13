import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { PaginatedProctorApplicationResponse } from '../../shared/proctor-application.response';
import { ListAllProctorApplicationsDto } from './list-all-applications.dto';
import { ListAllProctorApplicationsHandler } from './list-all-applications.handler';

@ApiTags('Proctor Applications')
@ApiBearerAuth('JWT-auth')
@Controller('proctor-applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ListAllProctorApplicationsEndpoint {
    constructor(private readonly handler: ListAllProctorApplicationsHandler) { }

    @Get()
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Get all proctor applications with filters (Admin/ExamOfficer only)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'teacherId', required: false, type: String })
    @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELED'] })
    @ApiQuery({ name: 'preferredDateStart', required: false, type: String })
    @ApiQuery({ name: 'preferredDateEnd', required: false, type: String })
    @ApiResponse({ status: 200, description: 'Applications retrieved', type: PaginatedProctorApplicationResponse })
    async handle(@Query() query: ListAllProctorApplicationsDto): Promise<PaginatedProctorApplicationResponse> {
        return this.handler.execute(query);
    }
}
