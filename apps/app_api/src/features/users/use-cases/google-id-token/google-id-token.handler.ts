import { Injectable, Inject, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { TokenService } from '@app/users';
import { IUserRepository, USER_REPOSITORY, User } from '@app/users';
import { RoleType } from '@app/users';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class GoogleIdTokenHandler {
    private readonly logger = new Logger(GoogleIdTokenHandler.name);
    private readonly googleClient: OAuth2Client;

    constructor(
        private readonly tokenService: TokenService,
        @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
        private readonly configService: ConfigService,
    ) {
        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
        this.googleClient = new OAuth2Client(clientId);
    }

    /**
     * Handle Google ID token verification and user authentication
     * @param idToken Google ID token from client
     * @returns User and app tokens
     */
    async handleGoogleToken(
        idToken: string,
    ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
        try {
            this.logger.log('📋 Starting Google ID token verification...');

            // 1. Verify Google token
            const ticket = await this.googleClient.verifyIdToken({
                idToken,
                audience: this.configService.get<string>('GOOGLE_CLIENT_ID'),
            });

            const payload = ticket.getPayload();
            if (!payload) {
                throw new UnauthorizedException('Invalid Google token payload');
            }

            const googleEmail = payload.email;
            const googleName = payload.name || 'User';
            const googlePhoto = payload.picture;

            if (!googleEmail) {
                throw new UnauthorizedException('Google token missing email');
            }

            this.logger.log(`✅ Token verified for email: ${googleEmail}`);

            // 2. Find or create user in database
            let user = await this.userRepository.findOne({ email: googleEmail });

            if (!user) {
                this.logger.log(`Creating new user: ${googleEmail}`);
                user = User.create({
                    id: uuidv4(),
                    email: googleEmail,
                    username: googleEmail.split('@')[0].toLowerCase(),
                    fullName: googleName,
                    avatarUrl: googlePhoto,
                    role: RoleType.STUDENT,
                });
                await this.userRepository.save(user);
            }

            // 3. Generate app tokens
            const accessToken = await this.tokenService.generateAccessToken(
                user.id,
                user.role?.value,
            );
            const refreshToken = await this.tokenService.generateRefreshToken(user.id);

            return { user, accessToken, refreshToken };
        } catch (error) {
            this.logger.error(`Google auth failed: ${error.message}`);
            throw new UnauthorizedException(
                `Google authentication failed: ${error.message}`,
            );
        }
    }
}
