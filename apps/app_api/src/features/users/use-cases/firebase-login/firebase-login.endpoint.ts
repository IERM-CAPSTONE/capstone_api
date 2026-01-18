import { Controller, Post, Body, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { TokenService } from '@app/users';
import { FirebaseLoginHandler } from './firebase-login.handler';
import { FirebaseAuthDto, AuthResponseDto } from './firebase-auth.dto';

@ApiTags('Auth')
@Controller('auth/firebase')
export class FirebaseLoginEndpoint {
    constructor(
        private readonly handler: FirebaseLoginHandler,
        private readonly tokenService: TokenService,
    ) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Authenticate with Firebase ID Token',
        description: 'Verifies Firebase ID token, finds or creates user, and returns app tokens'
    })
    @ApiBody({ type: FirebaseAuthDto })
    @ApiResponse({
        status: 200,
        description: 'Successfully authenticated',
        type: AuthResponseDto
    })
    @ApiResponse({
        status: 401,
        description: 'Firebase token verification failed'
    })
    async firebaseLogin(
        @Body() dto: FirebaseAuthDto,
        @Res() res: Response,
    ) {
        // Verify Firebase token and authenticate user
        const { user, accessToken, refreshToken } = await this.handler.handleFirebaseToken(
            dto.idToken,
        );

        // Set cookies
        this.tokenService.setCookies(res, accessToken, refreshToken);

        // Send response
        res.json({
            message: 'Successfully authenticated',
            user: {
                id: user.id,
                email: user.email.value,
                fullName: user.fullName,
                role: user.role?.value,
            },
            accessToken: accessToken,
            refreshToken: refreshToken,
        } as AuthResponseDto);
    }
}
