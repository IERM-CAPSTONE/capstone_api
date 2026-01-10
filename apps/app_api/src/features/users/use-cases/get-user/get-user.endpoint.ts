import { Controller, Get, Param, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
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

    @Get(':id')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Get user by ID' })
    @ApiParam({ name: 'id', description: 'User UUID', example: '123e4567-e89b-12d3-a456-426614174000' })
    @ApiResponse({ status: 200, description: 'User found', type: UserResponse })
    @ApiResponse({ status: 404, description: 'User not found' })
    async byId(@Param('id') id: string): Promise<UserResponse> {
        const user = await this.handler.byId(id);
        if (!user) throw new NotFoundException(`User '${id}' not found`);
        return user;
    }

    @Get('by-email/:email')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Get user by email' })
    @ApiParam({ name: 'email', description: 'User email address', example: 'user@example.com' })
    @ApiResponse({ status: 200, description: 'User found', type: UserResponse })
    @ApiResponse({ status: 404, description: 'User not found' })
    async byEmail(@Param('email') email: string): Promise<UserResponse> {
        const user = await this.handler.byEmail(email);
        if (!user) throw new NotFoundException(`User with email '${email}' not found`);
        return user;
    }

    @Get('by-code/:code')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Get user by code (MSSV or teacher code)' })
    @ApiParam({ name: 'code', description: 'Student ID (MSSV) or teacher code', example: 'SE123456' })
    @ApiResponse({ status: 200, description: 'User found', type: UserResponse })
    @ApiResponse({ status: 404, description: 'User not found' })
    async byCode(@Param('code') code: string): Promise<UserResponse> {
        const user = await this.handler.byCode(code);
        if (!user) throw new NotFoundException(`User with code '${code}' not found`);
        return user;
    }
}
