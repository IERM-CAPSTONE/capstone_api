import { Controller, Patch, Param, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { ProcessTicketDto } from './process-ticket.dto';
import { ProcessTicketHandler } from './process-ticket.handler';

@ApiTags('Tickets')
@ApiBearerAuth('JWT-auth')
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProcessTicketEndpoint {
    constructor(private readonly handler: ProcessTicketHandler) { }

    @Patch(':id/process')
    @Roles(
        RoleType.EXAM_OFFICER,
        RoleType.HALL_INVIGILATOR,
        RoleType.IT_SUPPORT,
        RoleType.PROCTOR,
    )
    @ApiOperation({ summary: 'Process a ticket: resolve (notify reporter) or assign (notify staff)' })
    async handle(
        @Param('id') id: string,
        @Body() dto: ProcessTicketDto,
        @Request() req: any,
    ): Promise<any> {
        try {
            return await this.handler.execute(id, dto, req.user.userId);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }
}
