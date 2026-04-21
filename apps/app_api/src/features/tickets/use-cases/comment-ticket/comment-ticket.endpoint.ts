import { Body, Controller, Param, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { CommentTicketDto } from './comment-ticket.dto';
import { CommentTicketHandler } from './comment-ticket.handler';

@ApiTags('Tickets')
@ApiBearerAuth('JWT-auth')
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommentTicketEndpoint {
    constructor(private readonly handler: CommentTicketHandler) { }

    @Post(':id/comments')
    @Roles(
        RoleType.EXAM_OFFICER,
        RoleType.HALL_INVIGILATOR,
        RoleType.IT_SUPPORT,
        RoleType.ADMIN,
        RoleType.PROCTOR,
        RoleType.STUDENT,
    )
    @ApiOperation({ summary: 'Add a comment/conclusion/resolution to a ticket' })
    async handle(
        @Param('id') id: string,
        @Body() dto: CommentTicketDto,
        @Request() req: any,
    ): Promise<any> {
        return this.handler.execute(id, dto, req.user.userId);
    }
}
