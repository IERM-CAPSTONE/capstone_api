import {
    Controller,
    Post,
    Body,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UserResponse } from '../../shared/user.response';
import { CreateUserDto } from './create-user.dto';
import { CreateUserHandler } from './create-user.handler';

@ApiTags('Users')
@Controller('users')
export class CreateUserEndpoint {
    constructor(private readonly handler: CreateUserHandler) { }

    @Post()
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
