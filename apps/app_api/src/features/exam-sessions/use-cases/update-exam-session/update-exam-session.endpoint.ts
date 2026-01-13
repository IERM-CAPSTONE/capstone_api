import { Controller, Patch, Param, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { ExamSessionResponse } from '../../shared/exam-session.response';
import { UpdateExamSessionDto } from './update-exam-session.dto';
import { UpdateExamSessionHandler } from './update-exam-session.handler';

@ApiTags('ExamSessions')
@ApiBearerAuth('JWT-auth')
@Controller('exam-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UpdateExamSessionEndpoint {
    constructor(private readonly handler: UpdateExamSessionHandler) { }

    @Patch(':id')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Update an exam session' })
    @ApiResponse({ status: 200, type: ExamSessionResponse })
    async handle(@Param('id') id: string, @Body() dto: UpdateExamSessionDto): Promise<ExamSessionResponse> {
        try {
            return await this.handler.execute(id, dto);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }
}
