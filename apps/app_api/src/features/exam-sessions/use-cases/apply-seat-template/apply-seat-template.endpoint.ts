import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { ApplySeatTemplateDto } from './apply-seat-template.dto';
import { ApplySeatTemplateHandler } from './apply-seat-template.handler';

@ApiTags('Exam Sessions')
@ApiBearerAuth('JWT-auth')
@Controller('exam-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ApplySeatTemplateEndpoint {
    constructor(private readonly handler: ApplySeatTemplateHandler) { }

    @Post(':id/apply-template')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({
        summary: 'Apply seat layout template to an exam session',
        description: 'Applies lock/unlock pattern for seats before students are assigned',
    })
    async applyTemplate(
        @Param('id') examSessionId: string,
        @Body() dto: ApplySeatTemplateDto,
    ) {
        return this.handler.handle(examSessionId, dto);
    }
}
