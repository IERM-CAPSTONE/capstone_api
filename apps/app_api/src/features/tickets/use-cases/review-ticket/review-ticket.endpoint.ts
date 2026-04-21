import { Body, Controller, Param, Patch, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { ReviewTicketDto } from './review-ticket.dto';
import { ReviewTicketHandler } from './review-ticket.handler';

@ApiTags('Tickets')
@ApiBearerAuth('JWT-auth')
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReviewTicketEndpoint {
    constructor(private readonly handler: ReviewTicketHandler) { }

    @Patch(':id/ai-candidates/:candidateId/review')
    @Roles(RoleType.EXAM_OFFICER, RoleType.ADMIN)
    @ApiOperation({ summary: 'Review an AI candidate generated from conclusion/resolution comments' })
    async handle(
        @Param('id') id: string,
        @Param('candidateId') candidateId: string,
        @Body() dto: ReviewTicketDto,
        @Request() req: any,
    ): Promise<any> {
        return this.handler.execute(id, candidateId, dto, req.user.userId);
    }

    @Patch(':id/review')
    @Roles(RoleType.EXAM_OFFICER, RoleType.ADMIN)
    @ApiOperation({ summary: 'Legacy AI review endpoint that reviews the newest pending candidate on a ticket' })
    async handleLegacy(
        @Param('id') id: string,
        @Body() dto: ReviewTicketDto,
        @Request() req: any,
    ): Promise<any> {
        return this.handler.execute(id, null, dto, req.user.userId);
    }
}
