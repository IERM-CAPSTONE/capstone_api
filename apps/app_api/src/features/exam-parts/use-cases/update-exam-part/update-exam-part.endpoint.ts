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
import { ExamPartResponse } from '../../shared/exam-part.response';
import { UpdateExamPartDto } from './update-exam-part.dto';
import { UpdateExamPartHandler } from './update-exam-part.handler';

@ApiTags('ExamParts')
@ApiBearerAuth('JWT-auth')
@Controller('exam-parts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UpdateExamPartEndpoint {
        Z
    constructor(private readonly handler: UpdateExamPartHandler) { }

    @Patch(':id')
    @Roles(RoleType.ADMIN)
    @ApiOperation({ summary: 'Update an exam type' })
    @ApiBody({ type: UpdateExamPartDto })
    @ApiResponse({ status: 200, description: 'Exam type updated successfully', type: ExamPartResponse })
    @ApiResponse({ status: 404, description: 'Exam type not found' })
    async handle(@Param('id') id: string, @Body() dto: UpdateExamPartDto): Promise<ExamPartResponse> {
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
