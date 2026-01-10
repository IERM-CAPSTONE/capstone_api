import {
    Controller,
    Patch,
    Param,
    Body,
    NotFoundException,
    BadRequestException,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { UserResponse } from '../../shared/user.response';
import { ChangeRoleDto } from './change-role.dto';
import { ChangeRoleHandler } from './change-role.handler';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChangeRoleEndpoint {
    constructor(private readonly handler: ChangeRoleHandler) { }

    @Patch(':id/role')
    @Roles(RoleType.ADMIN)
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
