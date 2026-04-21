import { Controller, Patch, Param, Body, NotFoundException, BadRequestException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles, GetUser } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { DeviceApplicationResponse } from '../../shared';
import { UpdateDeviceApplicationStatusDto } from './update-status.dto';
import { UpdateDeviceApplicationStatusHandler } from './update-status.handler';

@ApiTags('Device Applications')
@ApiBearerAuth('JWT-auth')
@Controller('admin/device-applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UpdateDeviceApplicationStatusEndpoint {
    constructor(private readonly handler: UpdateDeviceApplicationStatusHandler) { }

    @Patch(':id')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Update device application status (Admin/ExamOfficer only)' })
    @ApiParam({ name: 'id', description: 'Application UUID' })
    @ApiBody({ type: UpdateDeviceApplicationStatusDto })
    @ApiResponse({ status: 200, description: 'Status updated successfully', type: DeviceApplicationResponse })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 404, description: 'Application not found' })
    async handle(
        @Param('id') id: string,
        @Body() dto: UpdateDeviceApplicationStatusDto,
        @GetUser('userId') userId: string,
    ): Promise<DeviceApplicationResponse> {
        try {
            return await this.handler.execute(id, dto, userId);
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
