import { Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { TokenService } from '../../infrastructure/token.service';
import { RefreshTokenHandler } from './refresh-token.handler';

@ApiTags('Auth')
@Controller('auth/refresh')
export class RefreshTokenEndpoint {
    constructor(
        private readonly handler: RefreshTokenHandler,
        private readonly tokenService: TokenService,
    ) { }

    @Post()
    @UseGuards(AuthGuard('jwt-refresh'))
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Refresh access token using refresh token' })
    @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
    @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
    async refresh(@Req() req: any, @Res() res: Response) {
        const { userId } = req.user;

        const { accessToken, refreshToken } = await this.handler.handleRefresh(userId);

        // Update cookies
        this.tokenService.setCookies(res, accessToken, refreshToken);

        res.json({ message: 'Tokens refreshed successfully' });
    }
}
