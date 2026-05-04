import {
    Controller,
    Patch,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { GetUser, Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { ProctorApplicationResponse } from '../../shared/proctor-application.response';
import { UpdateProctorApplicationStatusDto } from './update-status.dto';
import { UpdateProctorApplicationStatusHandler } from './update-status.handler';

@ApiTags('Proctor Applications')
@ApiBearerAuth('JWT-auth')
@Controller('proctor-applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UpdateProctorApplicationStatusEndpoint {
    constructor(private readonly handler: UpdateProctorApplicationStatusHandler) { }

    @Patch(':id/status')
    @Roles(RoleType.PROCTOR, RoleType.HALL_INVIGILATOR)
    @ApiOperation({ summary: 'Respond to a proctor swap request - Accept/Decline (Target proctor only)' })
    @ApiParam({ name: 'id', description: 'Application UUID' })
    @ApiBody({ type: UpdateProctorApplicationStatusDto })
    @ApiResponse({ status: 200, description: 'Status updated successfully', type: ProctorApplicationResponse })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 404, description: 'Application not found' })
    async handle(
        @Param('id') id: string,
        @Body() dto: UpdateProctorApplicationStatusDto,
        @GetUser('userId') userId: string,
    ): Promise<ProctorApplicationResponse> {
        return await this.handler.execute(id, dto, userId);
    }
}
