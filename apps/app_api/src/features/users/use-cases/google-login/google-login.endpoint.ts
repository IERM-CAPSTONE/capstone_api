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

        // Prepare user data for frontend
        const userData = {
            id: user.id,
            email: user.email.value,
            fullName: user.fullName,
            role: user.role?.value,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };

        // Get frontend URL from config
        const frontendUrl = this.configService.get<string>('CLIENT_URL', 'http://localhost:3000');
        
        // Redirect to frontend callback page with user data in query params
        const callbackUrl = new URL('/auth/callback', frontendUrl);
        callbackUrl.searchParams.set('user', encodeURIComponent(JSON.stringify(userData)));

        // Redirect to frontend callback page
        res.redirect(callbackUrl.toString());
    }
}
