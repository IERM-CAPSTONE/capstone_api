import { Controller, Post, Body, BadRequestException, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles, GetUser } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { DeviceApplicationResponse } from '../../shared';
import { RegisterDeviceApplicationDto } from './register-device.dto';
import { RegisterDeviceApplicationHandler } from './register-device.handler';

@ApiTags('Device Applications')
@ApiBearerAuth('JWT-auth')
@Controller('device-applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RegisterDeviceApplicationEndpoint {
    constructor(private readonly handler: RegisterDeviceApplicationHandler) { }

    @Post('register')
    @Roles(RoleType.PROCTOR, RoleType.HALL_INVIGILATOR)
    @ApiOperation({ summary: 'Register device and create application (Proctor and Hall Invigilator)' })
    @ApiBody({ type: RegisterDeviceApplicationDto })
    @ApiResponse({ status: 201, description: 'Application created successfully', type: DeviceApplicationResponse })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async handle(
        @Body() dto: RegisterDeviceApplicationDto,
        @GetUser('userId') userId: string,
    ): Promise<DeviceApplicationResponse> {
        try {
            return await this.handler.execute(dto, userId);
        } catch (error) {
            if (error instanceof Error) {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }
}
