import { Controller, Patch, Param, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { ArchiveExamSessionHandler } from './archive-exam-session.handler';

@ApiTags('ExamSessions')
@ApiBearerAuth('JWT-auth')
@Controller('exam-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ArchiveExamSessionEndpoint {
  constructor(private readonly handler: ArchiveExamSessionHandler) {}

  @Patch(':id/archive')
  @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
  @ApiOperation({ summary: 'Archive an exam session (only if status is Ended)' })
  @ApiResponse({ status: 200, description: 'Exam session archived successfully' })
  @ApiResponse({ status: 400, description: 'Cannot archive exam with non-Ended status' })
  @ApiResponse({ status: 404, description: 'Exam session not found' })
  async handle(@Param('id') id: string): Promise<any> {
    try {
      return await this.handler.execute(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(error.message);
    }
  }
}
