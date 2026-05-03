import { Controller, Delete, Param, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles, GetUser } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { DeleteDeviceHandler } from './delete-device.handler';

@ApiTags('Devices')
@ApiBearerAuth('JWT-auth')
@Controller('devices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeleteDeviceEndpoint {
    constructor(private readonly handler: DeleteDeviceHandler) { }

    @Delete(':id')
    @Roles(RoleType.PROCTOR, RoleType.HALL_INVIGILATOR)
    @ApiOperation({ summary: 'Delete own device (Proctor and Hall Invigilator)' })
    @ApiParam({ name: 'id', description: 'Device UUID' })
    @ApiResponse({ status: 200, description: 'Device deleted successfully' })
    @ApiResponse({ status: 404, description: 'Device not found' })
    async handle(
        @Param('id') id: string,
        @GetUser('userId') userId: string,
    ): Promise<void> {
        try {
            await this.handler.execute(id, userId);
        } catch (error) {
            if (error instanceof Error && error.message.includes('not found')) {
                throw new NotFoundException(error.message);
            }
            throw error;
        }
    }
}
