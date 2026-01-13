import {
    Controller,
    Patch,
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
import { ExamRoomResponse } from '../../shared/exam-room.response';
import { UpdateExamRoomDto } from './update-exam-room.dto';
import { UpdateExamRoomHandler } from './update-exam-room.handler';

@ApiTags('ExamRooms')
@ApiBearerAuth('JWT-auth')
@Controller('exam-rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UpdateExamRoomEndpoint {
    constructor(private readonly handler: UpdateExamRoomHandler) { }

    @Patch(':id')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Update an exam room' })
    @ApiParam({ name: 'id', description: 'ExamRoom UUID' })
    @ApiBody({ type: UpdateExamRoomDto })
    @ApiResponse({ status: 200, description: 'Exam room updated successfully', type: ExamRoomResponse })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 404, description: 'Exam room not found' })
    @ApiResponse({ status: 409, description: 'Room number already exists' })
    async handle(
        @Param('id') id: string,
        @Body() dto: UpdateExamRoomDto,
    ): Promise<ExamRoomResponse> {
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
