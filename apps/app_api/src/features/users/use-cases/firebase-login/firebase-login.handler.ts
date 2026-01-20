import { Injectable, Inject, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
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
        private readonly configService: ConfigService,
    ) {
        // Initialize Firebase Admin SDK
        this.initializeFirebase();
    }

    private initializeFirebase() {
        try {
            // Check if Firebase is already initialized
            const apps = getApps();
            if (apps.length > 0) {
                return;
            }

            this.logger.log('Initializing Firebase Admin SDK...');

            // Priority 1: Read from process.env (direct)
            // Priority 2: Read from ConfigService (NestJS)
            const projectId = process.env.FIREBASE_PROJECT_ID || this.configService.get<string>('FIREBASE_PROJECT_ID');
            let privateKey = process.env.FIREBASE_PRIVATE_KEY || this.configService.get<string>('FIREBASE_PRIVATE_KEY');
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || this.configService.get<string>('FIREBASE_CLIENT_EMAIL');

            if (!projectId || !privateKey || !clientEmail) {
                this.logger.error(`Missing Firebase credentials. ProjectId: ${!!projectId}, Email: ${!!clientEmail}, Key: ${!!privateKey}`);
                return;
            }

            // Clean up private key (remove quotes and handle newlines)
            privateKey = privateKey.replace(/^"|"$/g, ''); // Remove leading/trailing quotes
            privateKey = privateKey.replace(/\\n/g, '\n'); // Handle escaped newlines

            this.logger.log(`Initializing Firebase for Project: ${projectId}`);

            // Initialize with explicit credentials from env
            initializeApp({
                credential: cert({
                    projectId,
                    privateKey,
                    clientEmail,
                }),
                projectId,
            });

            this.logger.log(`Firebase Admin SDK initialized successfully for project: ${projectId}`);
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
        this.initializeFirebase();

        try {
            this.logger.log('📋 Starting Firebase token verification...');

            // Double check apps presence
            if (getApps().length === 0) {
                throw new Error('Firebase app not initialized. Check logs for initialization errors.');
            }

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
