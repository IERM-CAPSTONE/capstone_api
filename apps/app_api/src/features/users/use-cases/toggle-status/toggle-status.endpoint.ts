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
import { UserResponse } from '../../shared/user.response';
import { ToggleStatusDto } from './toggle-status.dto';
import { ToggleStatusHandler } from './toggle-status.handler';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ToggleStatusEndpoint {
    constructor(private readonly handler: ToggleStatusHandler) { }

    @Patch(':id/status')
    @Roles(RoleType.ADMIN)
    @ApiOperation({ summary: 'Toggle user account status (active/locked)' })
    @ApiParam({ name: 'id', description: 'User UUID' })
    @ApiBody({ type: ToggleStatusDto })
    @ApiResponse({ status: 200, description: 'Status changed successfully', type: UserResponse })
    @ApiResponse({ status: 404, description: 'User not found' })
    async handle(
        @Param('id') id: string,
        @Body() dto: ToggleStatusDto,
    ): Promise<UserResponse> {
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
