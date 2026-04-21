import { Controller, Delete, Param, UseGuards, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { DeleteStudentExamHandler } from './delete-student-exam.handler';

@ApiTags('Student Exams')
@ApiBearerAuth('JWT-auth')
@Controller('student-exams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeleteStudentExamEndpoint {
    constructor(private readonly handler: DeleteStudentExamHandler) { }

    @Delete(':id')
    @HttpCode(204)
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Delete student exam' })
    @ApiResponse({ status: 204, description: 'Student exam deleted' })
    async handle(@Param('id') id: string): Promise<void> {
        return this.handler.execute(id);
    }
}
