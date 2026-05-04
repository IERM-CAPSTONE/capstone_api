import { Controller, Delete, Param, NotFoundException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles, GetUser } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { DeleteDeviceApplicationHandler } from './delete-application.handler';

@ApiTags('Device Applications')
@ApiBearerAuth('JWT-auth')
@Controller('device-applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeleteDeviceApplicationEndpoint {
    constructor(private readonly handler: DeleteDeviceApplicationHandler) { }

    @Delete(':id')
    @Roles(RoleType.PROCTOR, RoleType.HALL_INVIGILATOR)
    @ApiOperation({ summary: 'Delete own device application (Proctor and Hall Invigilator)' })
    @ApiParam({ name: 'id', description: 'Application UUID' })
    @ApiResponse({ status: 200, description: 'Application deleted successfully' })
    @ApiResponse({ status: 404, description: 'Application not found' })
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
