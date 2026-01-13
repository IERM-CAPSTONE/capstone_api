import { Controller, Post, Body, Res, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { TokenService } from '@app/users';
import { TestTokenDto } from './test-token.dto';
import { TestTokenHandler } from './test-token.handler';

@ApiTags('Auth')
@Controller('auth/test-token')
export class TestTokenEndpoint {
    constructor(
        private readonly handler: TestTokenHandler,
        private readonly tokenService: TokenService,
        private readonly configService: ConfigService,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Generate a test token (Only for non-production environments)' })
    @ApiResponse({ status: 200, description: 'Token generated successfully' })
    async generate(@Body() dto: TestTokenDto, @Res() res: Response) {
        // Security check: Only allow in development
        if (this.configService.get('NODE_ENV') === 'production') {
            throw new ForbiddenException('This endpoint is not available in production');
        }

        const { accessToken, refreshToken } = await this.handler.execute(dto);

        // Also set cookies for convenience in browser testing
        this.tokenService.setCookies(res, accessToken, refreshToken);

        res.json({
            accessToken,
            refreshToken,
            message: 'Tokens generated and set as cookies',
        });
    }
}
