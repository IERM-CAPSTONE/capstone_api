import { Injectable, Inject, UnauthorizedException, Logger } from '@nestjs/common';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { TokenService } from '@app/users';
import { IUserRepository, USER_REPOSITORY, User } from '@app/users';
import { RoleType } from '@app/users';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FirebaseLoginHandler {
    private readonly logger = new Logger(FirebaseLoginHandler.name);

    constructor(
        private readonly tokenService: TokenService,
        @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    ) {
        // Initialize Firebase Admin SDK
        this.initializeFirebase();
    }

    private initializeFirebase() {
        try {
            this.logger.log('Checking Firebase initialization...');
            
            // Check if Firebase is already initialized
            const apps = getApps();
            this.logger.log(`Current Firebase apps: ${apps.length}`);
            
            if (apps.length === 0) {
                this.logger.log('Initializing Firebase Admin SDK...');
                initializeApp();
                this.logger.log('Firebase Admin SDK initialized successfully');
            } else {
                this.logger.log('Firebase Admin SDK already initialized');
            }
        } catch (error) {
            this.logger.error('Firebase initialization error:', error);
            this.logger.error('Make sure GOOGLE_APPLICATION_CREDENTIALS env variable is set');
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
        try {
            this.logger.log('📋 Starting Firebase token verification...');
            this.logger.debug(`Token preview: ${idToken.substring(0, 50)}...`);

            // 1. Verify Firebase token
            this.logger.log('Step 1: Verifying token with Firebase Admin SDK...');
            const decodedToken = await getAuth().verifyIdToken(idToken);
            
            this.logger.log(` Token verified for uid: ${decodedToken.uid}`);
            
            const firebaseUid = decodedToken.uid;
            const firebaseEmail = decodedToken.email;
            const firebaseName = decodedToken.name || 'User';
            const firebasePhoto = decodedToken.picture;

            this.logger.log(`Firebase user: ${firebaseEmail}`);

            if (!firebaseEmail) {
                throw new UnauthorizedException('Firebase token missing email');
            }

            // 2. Find or create user in database
            this.logger.log('Step 2: Looking up user in database...');
            let user = await this.userRepository.findByEmail(firebaseEmail);

            if (!user) {
                this.logger.log(`Creating new user: ${firebaseEmail}`);
                
                // Create new user if not exists
                user = User.create({
                    id: uuidv4(),
                    email: firebaseEmail,
                    fullName: firebaseName,
                    avatarUrl: firebasePhoto,
                    role: RoleType.STUDENT, // Default role
                });
                await this.userRepository.save(user);
                this.logger.log(` New user created: ${user.id}`);
            } else {
                this.logger.log(` Existing user found: ${user.id}`);
            }

            // 3. Generate app tokens
            this.logger.log('Step 3: Generating app tokens...');
            const accessToken = await this.tokenService.generateAccessToken(
                user.id,
                user.role?.value,
            );
            const refreshToken = await this.tokenService.generateRefreshToken(user.id);

            this.logger.log(` Tokens generated successfully`);
            this.logger.log(`Access token expiry: 15 minutes`);
            this.logger.log(`Refresh token expiry: 7 days`);

            return { user, accessToken, refreshToken };
        } catch (error) {
            this.logger.error(' Firebase token verification failed!');
            this.logger.error(`Error: ${error.message}`);
            this.logger.error(`Stack: ${error.stack}`);

            if (error.code === 'auth/id-token-expired') {
                throw new UnauthorizedException('Firebase token has expired');
            }
            if (error.code === 'auth/id-token-revoked') {
                throw new UnauthorizedException('Firebase token has been revoked');
            }
            if (error.code === 'auth/invalid-id-token') {
                throw new UnauthorizedException('Invalid Firebase token format');
            }

            if (error instanceof UnauthorizedException) {
                throw error;
            }

            throw new UnauthorizedException(
                `Firebase authentication failed: ${error.message}`,
            );
        }
    }
}
