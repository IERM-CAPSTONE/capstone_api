import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PaginatedUserResponse } from '../../shared/user.response';
import { ListUsersDto } from './list-users.dto';
import { ListUsersHandler } from './list-users.handler';

@ApiTags('Users')
@Controller('users')
export class ListUsersEndpoint {
    constructor(private readonly handler: ListUsersHandler) { }

    @Get()
    @ApiOperation({ summary: 'Get list of users with pagination' })
    @ApiResponse({ status: 200, description: 'Users retrieved successfully', type: PaginatedUserResponse })
    async handle(@Query() query: ListUsersDto): Promise<PaginatedUserResponse> {
        return this.handler.execute(query);
    }
}
