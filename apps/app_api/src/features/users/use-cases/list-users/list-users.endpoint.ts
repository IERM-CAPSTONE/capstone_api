import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { PaginatedUserResponse } from '../../shared/user.response';
import { ListUsersDto } from './list-users.dto';
import { ListUsersHandler } from './list-users.handler';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ListUsersEndpoint {
    constructor(private readonly handler: ListUsersHandler) { }

    @Get()
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Get list of users with pagination' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
    @ApiQuery({ name: 'role', required: false, enum: RoleType, description: 'Filter by role' })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name, email, or code' })
    @ApiResponse({ status: 200, description: 'Users retrieved successfully', type: PaginatedUserResponse })
    async handle(@Query() query: ListUsersDto): Promise<PaginatedUserResponse> {
        return this.handler.execute(query);
    }
}
