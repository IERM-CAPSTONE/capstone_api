import { Controller, Delete, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { DeleteExamSessionHandler } from './delete-exam-session.handler';

@ApiTags('ExamSessions')
@ApiBearerAuth('JWT-auth')
@Controller('exam-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeleteExamSessionEndpoint {
    constructor(private readonly handler: DeleteExamSessionHandler) { }

    @Delete(':id')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Delete an exam session' })
    @ApiResponse({ status: 200, description: 'Deleted' })
    async handle(@Param('id') id: string): Promise<void> {
        try {
            await this.handler.execute(id);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }
}
