import {
    Controller,
    Patch,
    Body,
    Param,
    NotFoundException,
    BadRequestException,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { ExamTypeResponse } from '../../shared/exam-type.response';
import { UpdateExamTypeDto } from './update-exam-type.dto';
import { UpdateExamTypeHandler } from './update-exam-type.handler';

@ApiTags('ExamTypes')
@ApiBearerAuth('JWT-auth')
@Controller('exam-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UpdateExamTypeEndpoint {
    constructor(private readonly handler: UpdateExamTypeHandler) { }

    @Patch(':id')
    @Roles(RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Update an exam type' })
    @ApiBody({ type: UpdateExamTypeDto })
    @ApiResponse({ status: 200, description: 'Exam type updated successfully', type: ExamTypeResponse })
    @ApiResponse({ status: 404, description: 'Exam type not found' })
    async handle(@Param('id') id: string, @Body() dto: UpdateExamTypeDto): Promise<ExamTypeResponse> {
        try {
            return await this.handler.execute(id, dto);
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            if (error instanceof Error) {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }
}
