import {
    Controller,
    Delete,
    Param,
    NotFoundException,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { DeleteExamRoomHandler } from './delete-exam-room.handler';

@ApiTags('ExamRooms')
@ApiBearerAuth('JWT-auth')
@Controller('rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeleteExamRoomEndpoint {
    constructor(private readonly handler: DeleteExamRoomHandler) { }

    @Delete(':id')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Delete an exam room' })
    @ApiParam({ name: 'id', description: 'ExamRoom UUID' })
    @ApiResponse({ status: 200, description: 'Exam room deleted successfully' })
    @ApiResponse({ status: 404, description: 'Exam room not found' })
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
