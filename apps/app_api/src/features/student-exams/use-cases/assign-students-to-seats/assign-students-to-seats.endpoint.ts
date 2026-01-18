import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { AssignStudentsToSeatsDto } from './assign-students-to-seats.dto';
import { AssignStudentsToSeatsHandler } from './assign-students-to-seats.handler';
import { AssignStudentsToSeatsResponse } from './assign-students-to-seats.response';

@ApiTags('Student Exams - Seat Assignment')
@ApiBearerAuth('JWT-auth')
@Controller('student-exams/assign-seats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AssignStudentsToSeatsEndpoint {
    constructor(private readonly handler: AssignStudentsToSeatsHandler) { }

    @Post()
    @Roles(RoleType.EXAM_OFFICER, RoleType.ADMIN)
    @ApiOperation({
        summary: 'Assign students to seats in an exam session',
        description: 'Pure random seat assignment. Students are distributed randomly across available seats.',
    })
    @ApiResponse({ status: 201, description: 'Seats assigned successfully', type: AssignStudentsToSeatsResponse })
    @ApiResponse({ status: 401, description: 'Unauthorized: Only exam officers and admins can assign seats' })
    @ApiResponse({ status: 400, description: 'Invalid exam session or insufficient seats' })
    @ApiResponse({ status: 404, description: 'Exam session or room not found' })
    async handle(@Body() dto: AssignStudentsToSeatsDto): Promise<AssignStudentsToSeatsResponse> {
        return this.handler.execute(dto);
    }
}
