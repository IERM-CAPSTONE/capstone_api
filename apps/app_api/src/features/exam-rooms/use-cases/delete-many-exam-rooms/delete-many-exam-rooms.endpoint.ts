import {
    Controller,
    Delete,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { DeleteManyExamRoomsHandler } from './delete-many-exam-rooms.handler';

@ApiTags('ExamRooms')
@ApiBearerAuth('JWT-auth')
@Controller('exam-rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeleteManyExamRoomsEndpoint {
    constructor(private readonly handler: DeleteManyExamRoomsHandler) { }

    @Delete('bulk')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Delete multiple exam rooms based on filters' })
    @ApiQuery({ name: 'roomNumber', required: false })
    @ApiQuery({ name: 'campus', required: false })
    @ApiResponse({ status: 200, description: 'Exam rooms deleted successfully' })
    async handle(
        @Query('roomNumber') roomNumber?: string,
        @Query('campus') campus?: string
    ): Promise<{ deletedCount: number }> {
        const count = await this.handler.execute({
            roomNumber: roomNumber || undefined,
            campus: campus === "all" ? undefined : campus || undefined
        });
        return { deletedCount: count };
    }
}
