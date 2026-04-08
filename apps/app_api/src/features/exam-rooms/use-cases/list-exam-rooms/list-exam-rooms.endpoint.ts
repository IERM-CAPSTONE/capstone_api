import {
    Controller,
    Get,
    Query,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { PaginatedExamRoomResponse } from '../../shared/exam-room.response';
import { ListExamRoomsDto } from './list-exam-rooms.dto';
import { ListExamRoomsHandler } from './list-exam-rooms.handler';

@ApiTags('ExamRooms')
@ApiBearerAuth('JWT-auth')
@Controller('exam-rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ListExamRoomsEndpoint {
    constructor(private readonly handler: ListExamRoomsHandler) { }

    @Get()
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER, RoleType.PROCTOR, RoleType.HALL_INVIGILATOR)
    @ApiOperation({ summary: 'List exam rooms with pagination' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
    @ApiQuery({ name: 'roomNumber', required: false, type: Number, description: 'Filter by room number' })
    @ApiResponse({ status: 200, description: 'List of exam rooms', type: PaginatedExamRoomResponse })
    async handle(@Query() dto: ListExamRoomsDto): Promise<PaginatedExamRoomResponse> {
        return await this.handler.execute(dto);
    }
}
