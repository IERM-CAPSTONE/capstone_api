import { Controller, Get, Req, Res, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '@app/users';
import { GoogleLoginHandler } from './google-login.handler';
import axios from 'axios';

@ApiTags('Auth')
@Controller('auth/google')
export class GoogleLoginEndpoint {
    constructor(
        private readonly handler: GoogleLoginHandler,
        private readonly tokenService: TokenService,
        private readonly configService: ConfigService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Initiate Google OAuth login' })
    @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
    async googleAuth(@Req() req: any, @Res() res: Response) {
        const callbackURL = 'http://localhost:3002/api/auth/google/callback';
        
        console.log(`[GoogleAuth] Redirecting to Google OAuth with callback: ${callbackURL}`);
        
        const clientID = this.configService.get<string>('GOOGLE_CLIENT_ID');
        const scope = 'email profile';
        const redirectURI = encodeURIComponent(callbackURL);
        const googleAuthURL = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientID}&redirect_uri=${redirectURI}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
        
        res.redirect(googleAuthURL);
    }

    @Get('callback')
    @ApiOperation({ summary: 'Google OAuth callback' })
    @ApiResponse({ status: 200, description: 'Successfully logged in with Google' })
    async googleAuthRedirect(@Req() req: any, @Res() res: Response, @Query('code') code: string) {
        if (!code) {
            return res.status(400).json({ error: 'Authorization code not provided' });
        }

        try {
            // Exchange authorization code for tokens
            const clientID = this.configService.get<string>('GOOGLE_CLIENT_ID');
            const clientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
            
            // Detect callback origin - could be localhost or 10.0.2.2
            const host = req.get('host') || '';
            const referer = req.get('referer') || '';
            const isFromEmulator = host.includes('10.0.2.2') || referer.includes('10.0.2.2');
            
            const callbackURL = isFromEmulator
                ? 'http://10.0.2.2:3002/api/auth/google/callback'
                : 'http://localhost:3002/api/auth/google/callback';
            
            console.log(`[GoogleCallback] Request from emulator: ${isFromEmulator}, callback URL: ${callbackURL}`);

            // Exchange code for tokens
            let tokenResponse;
            try {
                tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
                    code,
                    client_id: clientID,
                    client_secret: clientSecret,
                    redirect_uri: 'http://localhost:3002/api/auth/google/callback',
                    grant_type: 'authorization_code',
                });
            } catch (error: any) {
                // If localhost fails, try 10.0.2.2 (for emulator)
                if (error.response?.status === 400 || error.response?.data?.error === 'redirect_uri_mismatch') {
                    try {
                        tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
                            code,
                            client_id: clientID,
                            client_secret: clientSecret,
                            redirect_uri: 'http://10.0.2.2:3002/api/auth/google/callback',
                            grant_type: 'authorization_code',
                        });
                    } catch (retryError) {
                        throw error; // Throw original error if both fail
                    }
                } else {
                    throw error;
                }
            }

            const { access_token } = tokenResponse.data;

            // Get user info from Google
            const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: { Authorization: `Bearer ${access_token}` },
            });

            const googleUser = {
                email: userInfoResponse.data.email,
                firstName: userInfoResponse.data.given_name,
                lastName: userInfoResponse.data.family_name,
                picture: userInfoResponse.data.picture,
                accessToken: access_token,
            };

            // Process login
            const { user, accessToken, refreshToken } = await this.handler.handleCallback(googleUser);

            // Set cookies
            this.tokenService.setCookies(res, accessToken, refreshToken);

            return res.json({
                message: 'Successfully logged in with Google',
                user: {
                    id: user.id,
                    email: user.email.value,
                    fullName: user.fullName,
                    role: user.role?.value,
                },
            });
        } catch (error) {
            res.status(500).json({ error: 'Failed to authenticate with Google', details: error.message });
        }
    }
}
