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
import { ExamRoomResponse } from '../../shared/exam-room.response';
import { CreateExamRoomDto } from './create-exam-room.dto';
import { CreateExamRoomHandler } from './create-exam-room.handler';

@ApiTags('ExamRooms')
@ApiBearerAuth('JWT-auth')
@Controller('exam-rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CreateExamRoomEndpoint {
    constructor(private readonly handler: CreateExamRoomHandler) { }

    @Post()
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Create a new exam room' })
    @ApiBody({ type: CreateExamRoomDto })
    @ApiResponse({ status: 201, description: 'Exam room created successfully', type: ExamRoomResponse })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 409, description: 'Exam room already exists' })
    async handle(@Body() dto: CreateExamRoomDto): Promise<ExamRoomResponse> {
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
