import { Injectable, Inject, Redirect } from '@nestjs/common';
import { TokenService } from '@app/users';
import { IUserRepository, USER_REPOSITORY, User } from '@app/users';
import { RoleType } from '@app/users';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GoogleLoginHandler {
    constructor(
        private readonly tokenService: TokenService,
        @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    ) { }

    async handleCallback(googleUser: any): Promise<{ user: User; accessToken: string; refreshToken: string }> {
        // 1. Find or create user
        let user = await this.userRepository.findByEmail(googleUser.email);

        if (!user) {
            // Create a new user if not exists
            user = User.create({
                id: uuidv4(),
                email: googleUser.email,
                fullName: `${googleUser.firstName} ${googleUser.lastName}`,
                avatarUrl: googleUser.picture,
                role: RoleType.STUDENT, // Default role
            });
            await this.userRepository.save(user);
        }

        // 2. Generate tokens
        const accessToken = await this.tokenService.generateAccessToken(user.id, user.role?.value);
        const refreshToken = await this.tokenService.generateRefreshToken(user.id);

        Redirect('http://localhost:3000/admin-dashboard');
        return { user, accessToken, refreshToken };
       
    }
}
