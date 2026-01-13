import { Controller, Get, Query, NotFoundException, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { UserResponse } from '../../shared/user.response';
import { GetUserHandler } from './get-user.handler';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GetUserEndpoint {
    constructor(private readonly handler: GetUserHandler) { }

    @Get('find')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Get user by ID, email or code' })
    @ApiQuery({ name: 'id', required: false, description: 'User UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiQuery({ name: 'email', required: false, description: 'User email address', example: 'user@example.com' })
    @ApiQuery({ name: 'code', required: false, description: 'Student ID (MSSV) or teacher code', example: 'SE123456' })
    @ApiResponse({ status: 200, description: 'User found', type: UserResponse })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 400, description: 'No search criteria provided' })
    async getUser(
        @Query('id') id?: string,
        @Query('email') email?: string,
        @Query('code') code?: string,
    ): Promise<UserResponse> {
        if (!id && !email && !code) {
            throw new BadRequestException('Please provide either id, email or code to find the user');
        }

        const user = await this.handler.execute({ id, email, code });

        if (!user) {
            const criteria = id ? `ID '${id}'` : email ? `email '${email}'` : `code '${code}'`;
            throw new NotFoundException(`User with ${criteria} not found`);
        }

        return user;
    }
}
