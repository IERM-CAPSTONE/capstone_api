import {
    Controller,
    Patch,
    Param,
    Body,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { UserResponse } from '../../shared/user.response';
import { ChangeRoleDto } from './change-role.dto';
import { ChangeRoleHandler } from './change-role.handler';

@ApiTags('Users')
@Controller('users')
export class ChangeRoleEndpoint {
    constructor(private readonly handler: ChangeRoleHandler) { }

    @Patch(':id/role')
    @ApiOperation({ summary: 'Change user role' })
    @ApiParam({ name: 'id', description: 'User UUID' })
    @ApiBody({ type: ChangeRoleDto })
    @ApiResponse({ status: 200, description: 'Role changed successfully', type: UserResponse })
    @ApiResponse({ status: 404, description: 'User not found' })
    async handle(
        @Param('id') id: string,
        @Body() dto: ChangeRoleDto,
    ): Promise<UserResponse> {
        try {
            return await this.handler.execute(id, dto);
        } catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('not found')) {
                    throw new NotFoundException(error.message);
                }
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }
}
