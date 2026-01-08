import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { TokenService } from '../../infrastructure/token.service';
import { GoogleLoginHandler } from './google-login.handler';

@ApiTags('Auth')
@Controller('auth/google')
export class GoogleLoginEndpoint {
    constructor(
        private readonly handler: GoogleLoginHandler,
        private readonly tokenService: TokenService,
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
    @ApiResponse({ status: 200, description: 'Successfully logged in with Google' })
    async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
        const googleUser = req.user;

        const { user, accessToken, refreshToken } = await this.handler.handleCallback(googleUser);

        // Set cookies
        this.tokenService.setCookies(res, accessToken, refreshToken);

        // Send response
        res.json({
            message: 'Successfully logged in with Google',
            user: {
                id: user.id,
                email: user.email.value,
                fullName: user.fullName,
                role: user.role?.value,
            },
        });
    }
}
