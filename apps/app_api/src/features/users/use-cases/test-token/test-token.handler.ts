import { Injectable } from '@nestjs/common';
import { TokenService } from '@app/users';
import { TestTokenDto } from './test-token.dto';

@Injectable()
export class TestTokenHandler {
    constructor(private readonly tokenService: TokenService) { }

    async execute(dto: TestTokenDto) {
        const userId = dto.userId || 'test-user-id';
        const accessToken = await this.tokenService.generateAccessToken(userId, dto.role);
        const refreshToken = await this.tokenService.generateRefreshToken(userId);

        return {
            accessToken,
            refreshToken,
        };
    }
}
