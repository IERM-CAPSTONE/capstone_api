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
    @ApiResponse({ status: 200, description: 'Users retrieved successfully', type: PaginatedUserResponse })
    async handle(@Query() query: ListUsersDto): Promise<PaginatedUserResponse> {
        return this.handler.execute(query);
    }
}
