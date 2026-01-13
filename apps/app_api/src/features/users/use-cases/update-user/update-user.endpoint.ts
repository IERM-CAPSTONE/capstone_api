import {
    Controller,
    Put,
    Param,
    Body,
    NotFoundException,
    ConflictException,
    BadRequestException,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { UserResponse } from '../../shared/user.response';
import { UpdateUserDto } from './update-user.dto';
import { UpdateUserHandler } from './update-user.handler';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UpdateUserEndpoint {
    constructor(private readonly handler: UpdateUserHandler) { }

    @Put(':id')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Update user by ID' })
    @ApiParam({ name: 'id', description: 'User UUID' })
    @ApiBody({ type: UpdateUserDto })
    @ApiResponse({ status: 200, description: 'User updated successfully', type: UserResponse })
    @ApiResponse({ status: 404, description: 'User not found' })
    @ApiResponse({ status: 409, description: 'Email or code already exists' })
    async handle(
        @Param('id') id: string,
        @Body() dto: UpdateUserDto,
    ): Promise<UserResponse> {
        try {
            return await this.handler.execute(id, dto);
        } catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('not found')) {
                    throw new NotFoundException(error.message);
                }
                if (error.message.includes('already exists')) {
                    throw new ConflictException(error.message);
                }
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }
}
