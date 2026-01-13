import { Controller, Get, Param, NotFoundException, UseGuards, Req, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
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

    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'Current user profile', type: UserResponse })
    async getProfile(@Req() req: any): Promise<UserResponse> {
        const userId = req.user.userId;
        const user = await this.handler.execute({ id: userId });
        if (!user) throw new NotFoundException(`User not found`);
        return user;
    }

    @Get(':id')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiParam({ name: 'id', description: 'User UUID' })
    @ApiResponse({ status: 200, description: 'User found', type: UserResponse })
    @ApiResponse({ status: 404, description: 'User not found' })
    async getUser(
        @Param('id') id: string,
    ): Promise<UserResponse> {
        if (!id) {
            throw new BadRequestException('User ID is required');
        }

        const user = await this.handler.execute({ id });

        if (!user) {
            throw new NotFoundException(`User with ID '${id}' not found`);
        }

        return user;
    }
}
