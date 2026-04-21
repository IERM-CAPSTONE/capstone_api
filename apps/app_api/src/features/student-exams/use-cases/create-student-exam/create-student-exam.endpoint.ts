import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { StudentExamResponse } from '../../shared/student-exam.response';
import { CreateStudentExamDto } from './create-student-exam.dto';
import { CreateStudentExamHandler } from './create-student-exam.handler';

@ApiTags('Student Exams')
@ApiBearerAuth('JWT-auth')
@Controller('student-exams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CreateStudentExamEndpoint {
    constructor(private readonly handler: CreateStudentExamHandler) { }

    @Post()
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Register student for exam session' })
    @ApiResponse({ status: 201, description: 'Student exam created', type: StudentExamResponse })
    async handle(@Body() dto: CreateStudentExamDto): Promise<StudentExamResponse> {
        return this.handler.execute(dto);
    }
}
