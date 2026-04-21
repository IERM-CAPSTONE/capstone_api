import { Injectable, Inject, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getAuth } from 'firebase-admin/auth';
import { TokenService } from '@app/users';
import { IUserRepository, USER_REPOSITORY, User } from '@app/users';
import { RoleType } from '@app/users';
import { v4 as uuidv4 } from 'uuid';
import { ensureFirebaseAdminInitialized } from '../../../../common/firebase/firebase-admin.helper';

@Injectable()
export class FirebaseLoginHandler {
    private readonly logger = new Logger(FirebaseLoginHandler.name);

    constructor(
        private readonly tokenService: TokenService,
        @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
        private readonly configService: ConfigService,
    ) {
        try {
            ensureFirebaseAdminInitialized(this.configService, this.logger);
        } catch (error) {
            this.logger.error('Firebase initialization error:', error);
        }
    }

    /**
     * Handle Firebase ID token verification and user authentication
     * @param idToken Firebase ID token from client
     * @returns User and app tokens
     */
    async handleFirebaseToken(
        idToken: string,
    ): Promise<{ user: User; accessToken: string; refreshToken: string }> {
        // Ensure initialized (fallback if constructor failed or async timing issue)
        ensureFirebaseAdminInitialized(this.configService, this.logger);

        try {
            this.logger.log('📋 Starting Firebase token verification...');

            // 1. Verify Firebase token
            const decodedToken = await getAuth().verifyIdToken(idToken);

            this.logger.log(` Token verified for email: ${decodedToken.email}`);

            const firebaseEmail = decodedToken.email;
            const firebaseName = decodedToken.name || 'User';
            const firebasePhoto = decodedToken.picture;

            if (!firebaseEmail) {
                throw new UnauthorizedException('Firebase token missing email');
            }

            // 2. Find or create user in database
            let user = await this.userRepository.findOne({ email: firebaseEmail });

            if (!user) {
                this.logger.log(`Creating new user: ${firebaseEmail}`);
                user = User.create({
                    id: uuidv4(),
                    email: firebaseEmail,
                    fullName: firebaseName,
                    avatarUrl: firebasePhoto,
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
            this.logger.error(`Firebase auth failed: ${error.message}`);

            if (error.code === 'auth/id-token-expired') {
                throw new UnauthorizedException('Firebase token has expired');
            }

            throw new UnauthorizedException(
                `Firebase authentication failed: ${error.message}`,
            );
        }
    }
}
