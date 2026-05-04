import {
    Controller,
    Patch,
    Param,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles, GetUser } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { ProctorApplicationResponse } from '../../shared/proctor-application.response';
import { CancelProctorApplicationHandler } from './cancel-application.handler';

@ApiTags('Proctor Applications')
@ApiBearerAuth('JWT-auth')
@Controller('proctor-applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CancelProctorApplicationEndpoint {
    constructor(private readonly handler: CancelProctorApplicationHandler) { }

    @Patch(':id/cancel')
    @Roles(RoleType.PROCTOR)
    @ApiOperation({ summary: 'Cancel own pending swap request (Requester only)' })
    @ApiParam({ name: 'id', description: 'Application UUID' })
    @ApiResponse({ status: 200, description: 'Application canceled successfully', type: ProctorApplicationResponse })
    @ApiResponse({ status: 400, description: 'Bad request / Cannot cancel this swap request' })
    @ApiResponse({ status: 403, description: 'Forbidden - Not your application' })
    @ApiResponse({ status: 404, description: 'Application not found' })
    async handle(
        @Param('id') id: string,
        @GetUser('userId') userId: string,
    ): Promise<ProctorApplicationResponse> {
        try {
            return await this.handler.execute(id, userId);
        } catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('not found')) {
                    throw new NotFoundException(error.message);
                }
                if (error.message.includes('Unauthorized')) {
                    throw new ForbiddenException(error.message);
                }
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }
}
