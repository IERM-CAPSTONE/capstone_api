import { Controller, Post, Body, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { PublishExamSessionsHandler } from './publish-exam-sessions.handler';
import { PublishExamSessionsDto } from './publish-exam-sessions.dto';

@ApiTags('ExamSessions')
@ApiBearerAuth('JWT-auth')
@Controller('exam-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PublishExamSessionsEndpoint {
    constructor(private readonly handler: PublishExamSessionsHandler) { }

    @Post('publish')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Publish draft exam sessions' })
    @ApiResponse({ status: 200, description: 'Exam sessions published successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async handle(@Body() dto: PublishExamSessionsDto): Promise<any> {
        try {
            return await this.handler.execute(dto);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }
}
