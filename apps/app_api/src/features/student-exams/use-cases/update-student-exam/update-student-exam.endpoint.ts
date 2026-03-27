import { Controller, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { StudentExamResponse } from '../../shared/student-exam.response';
import { UpdateStudentExamDto } from './update-student-exam.dto';
import { UpdateStudentExamHandler } from './update-student-exam.handler';

@ApiTags('Student Exams')
@ApiBearerAuth('JWT-auth')
@Controller('student-exams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UpdateStudentExamEndpoint {
    constructor(private readonly handler: UpdateStudentExamHandler) { }

    @Put(':id')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER, RoleType.PROCTOR, RoleType.IT_SUPPORT, RoleType.HALL_INVIGILATOR)
    @ApiOperation({ summary: 'Update student exam' })
    @ApiResponse({ status: 200, description: 'Student exam updated', type: StudentExamResponse })
    async handle(@Param('id') id: string, @Body() dto: UpdateStudentExamDto): Promise<StudentExamResponse> {
        return this.handler.execute(id, dto);
    }
}
