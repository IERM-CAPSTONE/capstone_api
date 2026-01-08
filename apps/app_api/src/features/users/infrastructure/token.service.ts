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

        res.cookie('access_token', accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax', // Corrected: restricted to sameSite if production, lax for local dev
            maxAge: 15 * 60 * 1000, // 15 mins
        });

        res.cookie('refresh_token', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
    }

    clearCookies(res: Response): void {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
    }
}
