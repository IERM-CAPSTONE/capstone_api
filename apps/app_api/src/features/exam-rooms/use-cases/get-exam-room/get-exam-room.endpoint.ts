import {
    Controller,
    Get,
    Param,
    NotFoundException,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { ExamRoomResponse } from '../../shared/exam-room.response';
import { GetExamRoomHandler } from './get-exam-room.handler';

@ApiTags('ExamRooms')
@ApiBearerAuth('JWT-auth')
@Controller('rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GetExamRoomEndpoint {
    constructor(private readonly handler: GetExamRoomHandler) { }

    @Get(':id')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER, RoleType.PROCTOR)
    @ApiOperation({ summary: 'Get an exam room by ID' })
    @ApiParam({ name: 'id', description: 'ExamRoom UUID' })
    @ApiResponse({ status: 200, description: 'Exam room found', type: ExamRoomResponse })
    @ApiResponse({ status: 404, description: 'Exam room not found' })
    async handle(@Param('id') id: string): Promise<ExamRoomResponse> {
        try {
            return await this.handler.execute(id);
        } catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                throw new NotFoundException(error.message);
            }
            throw error;
        }
    }
}
