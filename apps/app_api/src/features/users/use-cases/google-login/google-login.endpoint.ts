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
    ) {
        // Initialize allowed redirect URLs from environment
        const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
        this.allowedRedirectOrigins = [
            frontendUrl,
            'http://localhost:3000',
            'http://localhost:3002',
        ].filter((url) => url); // Remove falsy values
    }

    /**
     * Validates redirect URL to prevent open redirect vulnerabilities
     */
    private isValidRedirectUrl(url: string): boolean {
        try {
            const parsedUrl = new URL(url);
            return this.allowedRedirectOrigins.some(
                (origin) => new URL(origin).origin === parsedUrl.origin,
            );
        } catch {
            return false;
        }
    }

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
    @ApiResponse({ status: 200, description: 'Successfully logged in with Google' })
    async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
        const googleUser = req.user;

        const { user, accessToken, refreshToken } = await this.handler.handleCallback(googleUser);

        // Set cookies
        this.tokenService.setCookies(res, accessToken, refreshToken);

        // Validate and redirect to frontend admin dashboard
        const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
        const redirectUrl = `${frontendUrl}/admin-dashboard`;

        if (!this.isValidRedirectUrl(redirectUrl)) {
            throw new BadRequestException(
                'Invalid redirect URL. Possible security threat detected.',
            );
        }

        return res.redirect(redirectUrl);
    }
}
