import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { ExamSessionResponse } from '../../shared/exam-session.response';
import { CreateExamSessionDto } from './create-exam-session.dto';
import { CreateExamSessionHandler } from './create-exam-session.handler';

@ApiTags('ExamSessions')
@ApiBearerAuth('JWT-auth')
@Controller('exam-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CreateExamSessionEndpoint {
    constructor(private readonly handler: CreateExamSessionHandler) { }

    @Post()
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Create a new exam session' })
    @ApiResponse({ status: 201, type: ExamSessionResponse })
    async handle(@Body() dto: CreateExamSessionDto): Promise<ExamSessionResponse> {
        try {
            return await this.handler.execute(dto);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }
}
