import { Controller, Post, Body, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { TokenService } from '@app/users';
import { GoogleIdTokenHandler } from './google-id-token.handler';
import { GoogleIdTokenDto } from './google-id-token.dto';

@ApiTags('Auth')
@Controller('auth/google')
export class GoogleIdTokenEndpoint {
    constructor(
        private readonly handler: GoogleIdTokenHandler,
        private readonly tokenService: TokenService,
    ) { }

    @Post('id-token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Authenticate with Google ID Token',
        description: 'Verifies Google ID token, finds or creates user, and returns app tokens'
    })
    @ApiBody({ type: GoogleIdTokenDto })
    @ApiResponse({
        status: 200,
        description: 'Successfully authenticated'
    })
    @ApiResponse({
        status: 401,
        description: 'Google token verification failed'
    })
    async googleIdTokenLogin(
        @Body() dto: GoogleIdTokenDto,
        @Res() res: Response,
    ) {
        // Verify Google token and authenticate user
        const { user, accessToken, refreshToken } = await this.handler.handleGoogleToken(
            dto.idToken,
        );

        // Set cookies (consistent with existing auth)
        this.tokenService.setCookies(res, accessToken, refreshToken);

        // Send response
        res.json({
            message: 'Successfully authenticated',
            user: {
                id: user.id,
                email: user.email.value,
                fullName: user.fullName,
                role: user.role?.value,
                code: user.code?.value,
                avatarUrl: user.avatarUrl,
            },
            accessToken: accessToken,
            refreshToken: refreshToken,
        });
    }
}
