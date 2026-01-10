import {
    Controller,
    Post,
    Body,
    ConflictException,
    BadRequestException,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { UserResponse } from '../../shared/user.response';
import { CreateUserDto } from './create-user.dto';
import { CreateUserHandler } from './create-user.handler';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CreateUserEndpoint {
    constructor(private readonly handler: CreateUserHandler) { }

    @Post()
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Create a new user' })
    @ApiBody({ type: CreateUserDto })
    @ApiResponse({ status: 201, description: 'User created successfully', type: UserResponse })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 409, description: 'User already exists' })
    async handle(@Body() dto: CreateUserDto): Promise<UserResponse> {
        try {
            return await this.handler.execute(dto);
        } catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('already exists')) {
                    throw new ConflictException(error.message);
                }
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }
}
