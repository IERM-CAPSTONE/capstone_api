import { Controller, Get, Param, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles, GetUser } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { DeviceApplicationResponse } from '../../shared';
import { GetDeviceApplicationHandler } from './get-application.handler';

@ApiTags('Device Applications')
@ApiBearerAuth('JWT-auth')
@Controller('device-applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GetDeviceApplicationEndpoint {
    constructor(private readonly handler: GetDeviceApplicationHandler) { }

    @Get(':id')
    @Roles(RoleType.PROCTOR, RoleType.HALL_INVIGILATOR, RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Get device application by id' })
    @ApiParam({ name: 'id', description: 'Application UUID' })
    @ApiResponse({ status: 200, description: 'Application retrieved', type: DeviceApplicationResponse })
    @ApiResponse({ status: 404, description: 'Application not found' })
    async handle(
        @Param('id') id: string,
        @GetUser('userId') userId: string,
        @GetUser('role') role: string,
    ): Promise<DeviceApplicationResponse> {
        try {
            return await this.handler.execute(id, userId, role);
        } catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                throw new NotFoundException(error.message);
            }
            throw error;
        }
    }
}
