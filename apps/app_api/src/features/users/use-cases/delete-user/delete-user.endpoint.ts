import {
    Controller,
    Delete,
    Param,
    HttpCode,
    HttpStatus,
    NotFoundException,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { DeleteUserHandler } from './delete-user.handler';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeleteUserEndpoint {
    constructor(private readonly handler: DeleteUserHandler) { }

    @Delete(':id')
    @Roles(RoleType.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete user by ID' })
    @ApiParam({ name: 'id', description: 'User UUID' })
    @ApiResponse({ status: 204, description: 'User deleted successfully' })
    @ApiResponse({ status: 404, description: 'User not found' })
    async handle(@Param('id') id: string): Promise<void> {
        try {
            await this.handler.execute(id);
        } catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                throw new NotFoundException(error.message);
            }
            throw error;
        }
    }
}
