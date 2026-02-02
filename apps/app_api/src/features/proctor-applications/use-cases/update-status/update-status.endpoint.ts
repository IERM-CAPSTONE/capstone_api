import {
    Controller,
    Patch,
    Param,
    Body,
    NotFoundException,
    BadRequestException,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
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
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Update application status - Approve/Reject (Admin/ExamOfficer only)' })
    @ApiParam({ name: 'id', description: 'Application UUID' })
    @ApiBody({ type: UpdateProctorApplicationStatusDto })
    @ApiResponse({ status: 200, description: 'Status updated successfully', type: ProctorApplicationResponse })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 404, description: 'Application not found' })
    async handle(
        @Param('id') id: string,
        @Body() dto: UpdateProctorApplicationStatusDto,
    ): Promise<ProctorApplicationResponse> {
        try {
            return await this.handler.execute(id, dto);
        } catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('not found')) {
                    throw new NotFoundException(error.message);
                }
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }
}
