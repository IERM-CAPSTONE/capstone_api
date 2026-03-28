import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { StudentExamResponse } from '../../shared/student-exam.response';
import { GetStudentExamHandler } from './get-student-exam.handler';

@ApiTags('Student Exams')
@ApiBearerAuth('JWT-auth')
@Controller('student-exams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GetStudentExamEndpoint {
    constructor(private readonly handler: GetStudentExamHandler) { }

    @Get(':id')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER, RoleType.PROCTOR, RoleType.IT_SUPPORT, RoleType.HALL_INVIGILATOR)
    @ApiOperation({ summary: 'Get student exam by ID' })
    @ApiResponse({ status: 200, description: 'Student exam retrieved', type: StudentExamResponse })
    async handle(@Param('id') id: string): Promise<StudentExamResponse> {
        return this.handler.execute(id);
    }
}
