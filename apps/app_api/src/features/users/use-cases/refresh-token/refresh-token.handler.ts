import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { TokenService } from '@app/users';
import { IUserRepository, USER_REPOSITORY } from '@app/users';

@Injectable()
export class RefreshTokenHandler {
    constructor(
        private readonly tokenService: TokenService,
        @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    ) { }

    async handleRefresh(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
        console.log('[REFRESH] Received userId from refresh token:', userId);

        // Find user to get the role
        const user = await this.userRepository.findOne({ id: userId });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        console.log('[REFRESH] Found user:', { id: user.id, email: user.email?.value, role: user.role?.value });

        // Generate new tokens
        const accessToken = await this.tokenService.generateAccessToken(user.id, user.role?.value);
        const refreshToken = await this.tokenService.generateRefreshToken(user.id);

        console.log('[REFRESH] Generated new tokens for user:', user.id);

        return { accessToken, refreshToken };
    }
}
