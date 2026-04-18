import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { RoleType } from '@app/users';
import { ApplySeatTemplateDto } from './apply-seat-template.dto';
import { ApplySeatTemplateHandler } from './apply-seat-template.handler';

@ApiTags('Exam Seats')
@ApiBearerAuth('JWT-auth')
@Controller('exam-seats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplySeatTemplateEndpoint {
  constructor(private readonly handler: ApplySeatTemplateHandler) {}

  @Patch('session/:sessionId/template')
  @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
  @ApiOperation({
    summary: 'Apply seat lock template to a session',
    description:
      'Applies RESET, CHECKERBOARD, or MANUAL lock template. Only Available/Locked seats are editable; assigned/present/absent seats are preserved.',
  })
  async applyTemplate(
    @Param('sessionId') sessionId: string,
    @Body() dto: ApplySeatTemplateDto,
  ) {
    return this.handler.execute(sessionId, dto);
  }
}
