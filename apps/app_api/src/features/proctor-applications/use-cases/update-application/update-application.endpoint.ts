import {
    Controller,
    Put,
    Param,
    Body,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles, GetUser } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { ProctorApplicationResponse } from '../../shared/proctor-application.response';
import { UpdateProctorApplicationDto } from './update-application.dto';
import { UpdateProctorApplicationHandler } from './update-application.handler';

@ApiTags('Proctor Applications')
@ApiBearerAuth('JWT-auth')
@Controller('proctor-applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UpdateProctorApplicationEndpoint {
    constructor(private readonly handler: UpdateProctorApplicationHandler) { }

    @Put(':id')
    @Roles(RoleType.PROCTOR)
    @ApiOperation({ summary: 'Update own proctor application (Proctor only, PENDING status only)' })
    @ApiParam({ name: 'id', description: 'Application UUID' })
    @ApiBody({ type: UpdateProctorApplicationDto })
    @ApiResponse({ status: 200, description: 'Application updated successfully', type: ProctorApplicationResponse })
    @ApiResponse({ status: 400, description: 'Bad request / Cannot edit non-PENDING application' })
    @ApiResponse({ status: 403, description: 'Forbidden - Not your application' })
    @ApiResponse({ status: 404, description: 'Application not found' })
    async handle(
        @Param('id') id: string,
        @Body() dto: UpdateProctorApplicationDto,
        @GetUser('userId') userId: string,
    ): Promise<ProctorApplicationResponse> {
        try {
            return await this.handler.execute(id, dto, userId);
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
