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

    @Patch(':id/review')
    @Roles(RoleType.EXAM_OFFICER, RoleType.ADMIN)
    @ApiOperation({ summary: 'Review a custom ticket outcome before it can be used for AI training' })
    async handle(
        @Param('id') id: string,
        @Body() dto: ReviewTicketDto,
        @Request() req: any,
    ): Promise<any> {
        return this.handler.execute(id, dto, req.user.userId);
    }
}
