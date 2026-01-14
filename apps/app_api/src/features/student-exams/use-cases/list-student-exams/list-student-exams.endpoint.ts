import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { PaginatedStudentExamResponse } from '../../shared/student-exam.response';
import { ListStudentExamsDto } from './list-student-exams.dto';
import { ListStudentExamsHandler } from './list-student-exams.handler';

@ApiTags('Student Exams')
@ApiBearerAuth('JWT-auth')
@Controller('student-exams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ListStudentExamsEndpoint {
    constructor(private readonly handler: ListStudentExamsHandler) { }

    @Get()
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER, RoleType.PROCTOR)
    @ApiOperation({ summary: 'Get list of student exams' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'examSessionId', required: false, type: String })
    @ApiQuery({ name: 'studentId', required: false, type: String })
    @ApiQuery({ name: 'status', required: false, enum: ['REGISTERED', 'CHECKEDIN', 'CHECKEDOUT', 'MOVED', 'REMOVED'] })
    @ApiResponse({ status: 200, description: 'Student exams retrieved', type: PaginatedStudentExamResponse })
    async handle(@Query() query: ListStudentExamsDto): Promise<PaginatedStudentExamResponse> {
        return this.handler.execute(query);
    }
}
