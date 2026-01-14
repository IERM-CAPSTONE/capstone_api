import { Controller, Get, Req, Res, UseGuards, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { TokenService } from '@app/users';
import { GoogleLoginHandler } from './google-login.handler';

@ApiTags('Auth')
@Controller('auth/google')
export class GoogleLoginEndpoint {
    private readonly allowedRedirectOrigins: string[];

    constructor(
        private readonly handler: GoogleLoginHandler,
        private readonly tokenService: TokenService,
        private readonly configService: ConfigService,
    ) { }
    
    @Get()
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Initiate Google OAuth login' })
    @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
    async googleAuth() {
        // Guard triggers Google OAuth redirect
    }

    @Get('callback')
    @UseGuards(AuthGuard('google'))
    @ApiOperation({ summary: 'Google OAuth callback' })
    @ApiResponse({ status: 302, description: 'Redirects to frontend callback page' })
    async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
        const googleUser = req.user;

        // Handle callback and get user with tokens
        const { user, accessToken, refreshToken } = await this.handler.handleCallback(googleUser);

        // Set authentication cookies (tokens are stored in httpOnly cookies)
        this.tokenService.setCookies(res, accessToken, refreshToken);

        // Redirect to frontend callback page
        // Frontend will fetch user info, check role, and redirect to dashboard if admin
        const clientUrl = this.configService.get<string>('CLIENT_URL', 'http://localhost:3000');
        return res.redirect(`${clientUrl}/auth/callback`);
    }
}
