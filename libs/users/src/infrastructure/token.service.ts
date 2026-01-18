import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';

@Injectable()
export class TokenService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
    ) { }

    async generateAccessToken(userId: string, role: string): Promise<string> {
        return this.jwtService.signAsync(
            { sub: userId, role },
            {
                secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
                expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION', '15m') as any,
            },
        );
    }

    async generateRefreshToken(userId: string): Promise<string> {
        return this.jwtService.signAsync(
            { sub: userId },
            {
                secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
                expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d') as any,
            },
        );
    }

    setCookies(res: Response, accessToken: string, refreshToken: string): void {
        const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

        const cookieOptions = {
            httpOnly: true,
            secure: isProduction, // Chỉ bật Secure khi có HTTPS (Production)
            sameSite: (isProduction ? 'strict' : 'lax') as any,
            path: '/',
            maxAge: 15 * 60 * 1000,
        };

        res.cookie('access_token', accessToken, cookieOptions);
        res.cookie('refresh_token', refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
    }

    clearCookies(res: Response): void {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
    }
}
