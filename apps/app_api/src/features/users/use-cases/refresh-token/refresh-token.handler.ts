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
        // Find user to get the role
        const user = await this.userRepository.findOne({ id: userId });
        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        // Generate new tokens
        const accessToken = await this.tokenService.generateAccessToken(user.id, user.role?.value);
        const refreshToken = await this.tokenService.generateRefreshToken(user.id);

        return { accessToken, refreshToken };
    }
}
