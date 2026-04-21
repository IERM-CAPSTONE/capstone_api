import { Controller, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UpdateStudentExamPartHandler } from './update-student-exam-part.handler';
import { UpdateStudentExamPartDto } from './update-student-exam-part.dto';

@ApiTags('Student Exams')
@ApiBearerAuth()
@Controller('student-exam-parts')
export class UpdateStudentExamPartEndpoint {
    constructor(private readonly handler: UpdateStudentExamPartHandler) { }

    @Patch(':id')
    @ApiOperation({ summary: 'Update attendance/submission status for a specific exam part of a student' })
    @ApiResponse({ status: 200, description: 'StudentExamPart updated successfully' })
    @ApiResponse({ status: 404, description: 'StudentExamPart not found' })
    async execute(
        @Param('id') id: string,
        @Body() dto: UpdateStudentExamPartDto,
    ) {
        return this.handler.execute(id, dto);
    }
}
