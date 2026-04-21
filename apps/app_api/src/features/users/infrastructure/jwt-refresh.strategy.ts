import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
    constructor(private readonly configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([
                ExtractJwt.fromAuthHeaderAsBearerToken(),
                (request: Request) => {
                    return request?.cookies?.refresh_token;
                },
            ]),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
            passReqToCallback: true, // ✅ Fixed typo: was "passToReqToCallback"
        });
    }

    async validate(req: Request, payload: any) {
        console.log('[JWT-REFRESH-STRATEGY] Validating payload:', { sub: payload.sub, iat: payload.iat, exp: payload.exp });

        let refreshToken = req.cookies?.refresh_token;

        // If not in cookies, try to extract from Authorization header
        if (!refreshToken && req.headers.authorization) {
            const parts = req.headers.authorization.split(' ');
            if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
                refreshToken = parts[1];
            }
        }

        const userId = payload.sub;
        console.log('[JWT-REFRESH-STRATEGY] Extracted userId:', userId);
        return { userId, refreshToken };
    }
}
