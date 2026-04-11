import { Controller, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { BulkProcessTicketDto } from './bulk-process-ticket.dto';
import { BulkProcessTicketHandler } from './bulk-process-ticket.handler';

@ApiTags('Tickets')
@ApiBearerAuth('JWT-auth')
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BulkProcessTicketEndpoint {
    constructor(private readonly handler: BulkProcessTicketHandler) { }

    @Post('bulk-process')
    @Roles(RoleType.EXAM_OFFICER, RoleType.IT_SUPPORT, RoleType.HALL_INVIGILATOR, RoleType.ADMIN)
    @ApiOperation({ summary: 'Bulk ticket actions for comment, route, lifecycle, and legacy process operations' })
    async handle(
        @Body() dto: BulkProcessTicketDto,
        @Request() req: any,
    ): Promise<any> {
        try {
            return await this.handler.execute(dto, req.user.userId);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }
}
