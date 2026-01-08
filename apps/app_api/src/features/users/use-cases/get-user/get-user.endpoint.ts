import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { UserResponse } from '../../shared/user.response';
import { GetUserHandler } from './get-user.handler';

@ApiTags('Users')
@Controller('users')
export class GetUserEndpoint {
    constructor(private readonly handler: GetUserHandler) { }

    @Get(':id')
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
