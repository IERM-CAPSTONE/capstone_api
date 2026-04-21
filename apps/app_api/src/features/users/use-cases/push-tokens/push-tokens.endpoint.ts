import { Body, Controller, Delete, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../../common/guards';
import { RegisterPushTokenDto } from './register-push-token.dto';
import { RemovePushTokenDto } from './remove-push-token.dto';
import { PushTokensHandler } from './push-tokens.handler';

@ApiTags('Auth')
@ApiBearerAuth('JWT-auth')
@Controller('auth/me/push-tokens')
@UseGuards(JwtAuthGuard)
export class PushTokensEndpoint {
    constructor(private readonly handler: PushTokensHandler) { }

    @Post()
    @ApiOperation({ summary: 'Register or refresh current device push token' })
    @ApiBody({ type: RegisterPushTokenDto })
    @ApiResponse({ status: 200, description: 'Push token registered successfully' })
    async register(@Req() req: any, @Body() dto: RegisterPushTokenDto) {
        const userId = req.user?.userId;
        return this.handler.register(userId, dto);
    }

    @Delete()
    @ApiOperation({ summary: 'Deactivate current device push token' })
    @ApiBody({ type: RemovePushTokenDto })
    @ApiResponse({ status: 200, description: 'Push token deactivated successfully' })
    async remove(@Req() req: any, @Body() dto: RemovePushTokenDto) {
        const userId = req.user?.userId;
        return this.handler.remove(userId, dto);
    }
}
