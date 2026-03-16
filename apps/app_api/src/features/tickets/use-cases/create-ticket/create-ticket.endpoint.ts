import { Controller, Post, Body, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { CreateTicketDto } from './create-ticket.dto';
import { CreateTicketHandler } from './create-ticket.handler';

@ApiTags('Tickets')
@ApiBearerAuth('JWT-auth')
@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CreateTicketEndpoint {
    constructor(private readonly handler: CreateTicketHandler) { }

    @Post()
    @Roles(RoleType.PROCTOR, RoleType.IT_SUPPORT, RoleType.HALL_INVIGILATOR)
    @ApiOperation({ summary: 'Create a new ticket (Proctor / IT Support / Hall Invigilator only)' })
    @ApiResponse({ status: 201, description: 'Ticket created and Exam Officers notified.' })
    async handle(@Body() dto: CreateTicketDto, @Request() req: any): Promise<any> {
        try {
            return await this.handler.execute(dto, req.user.userId);
        } catch (error) {
            throw new BadRequestException(error.message);
        }
    }
}
