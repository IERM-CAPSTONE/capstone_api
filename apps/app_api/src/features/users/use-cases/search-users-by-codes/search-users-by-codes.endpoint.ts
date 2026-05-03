import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SearchUsersByCodesHandler } from './search-users-by-codes.handler';
import { SearchUsersByCodesDto } from './search-users-by-codes.dto';
import { UserResponse } from '../../shared/user.response';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { Roles } from '../../../../common/decorators';
import { RoleType } from '@app/users';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users/search-by-codes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
export class SearchUsersByCodesEndpoint {
    constructor(private readonly handler: SearchUsersByCodesHandler) { }

    @Post()
    @ApiOperation({ summary: 'Search users by their codes' })
    @ApiResponse({ status: 200, type: [UserResponse] })
    async execute(@Body() dto: SearchUsersByCodesDto): Promise<UserResponse[]> {
        return this.handler.execute(dto);
    }
}
