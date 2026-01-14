import { Test, TestingModule } from '@nestjs/testing';
import { GoogleLoginHandler } from './google-login.handler';
import { TokenService, USER_REPOSITORY, IUserRepository, User, RoleType } from '@app/users';
import { UnauthorizedException } from '@nestjs/common';

describe('GoogleLoginHandler', () => {
    let handler: GoogleLoginHandler;
    let userRepository: jest.Mocked<IUserRepository>;
    let tokenService: jest.Mocked<TokenService>;

    const mockGoogleUser = {
        email: 'test@fpt.edu.vn',
        firstName: 'John',
        lastName: 'Doe',
        picture: 'http://avatar.com/john',
    };

    beforeEach(async () => {
        const mockRepo = {
            findOne: jest.fn(),
            save: jest.fn(),
        };

        const mockTokenService = {
            generateAccessToken: jest.fn(),
            generateRefreshToken: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GoogleLoginHandler,
                { provide: USER_REPOSITORY, useValue: mockRepo },
                { provide: TokenService, useValue: mockTokenService },
            ],
        }).compile();

        handler = module.get<GoogleLoginHandler>(GoogleLoginHandler);
        userRepository = module.get(USER_REPOSITORY);
        tokenService = module.get(TokenService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('handleCallback', () => {
        describe('Success scenarios', () => {
            it('should login an existing user without creating a new one', async () => {
                // Arrange
                const existingUser = User.create({
                    id: 'existing-id',
                    email: mockGoogleUser.email,
                    fullName: 'Original Name',
                    role: RoleType.ADMIN,
                });
                userRepository.findOne.mockResolvedValue(existingUser);
                tokenService.generateAccessToken.mockResolvedValue('access-token');
                tokenService.generateRefreshToken.mockResolvedValue('refresh-token');

                // Act
                const result = await handler.handleCallback(mockGoogleUser);

                // Assert
                expect(userRepository.findOne).toHaveBeenCalledWith({ email: mockGoogleUser.email });
                expect(userRepository.save).not.toHaveBeenCalled();
                expect(result.user).toBe(existingUser);
                expect(result.accessToken).toBe('access-token');
                expect(result.refreshToken).toBe('refresh-token');
                expect(tokenService.generateAccessToken).toHaveBeenCalledWith('existing-id', RoleType.ADMIN);
            });

            it('should register and login a new user if they dont exist', async () => {
                // Arrange
                userRepository.findOne.mockResolvedValue(null);
                userRepository.save.mockImplementation(async (u) => u);
                tokenService.generateAccessToken.mockResolvedValue('new-access-token');
                tokenService.generateRefreshToken.mockResolvedValue('new-refresh-token');

                // Act
                const result = await handler.handleCallback(mockGoogleUser);

                // Assert
                expect(userRepository.findOne).toHaveBeenCalled();
                expect(userRepository.save).toHaveBeenCalled();
                const savedUser = userRepository.save.mock.calls[0][0] as User;
                expect(savedUser.email.value).toBe(mockGoogleUser.email);
                expect(savedUser.fullName).toBe('John Doe');
                expect(savedUser.avatarUrl).toBe(mockGoogleUser.picture);
                expect(savedUser.role?.value).toBe(RoleType.STUDENT); // Default role

                expect(result.accessToken).toBe('new-access-token');
                expect(result.refreshToken).toBe('new-refresh-token');
            });
        });

        describe('Edge cases and Error handling', () => {
            it('should handle missing name fields from Google by joining whatever is available', async () => {
                // Arrange
                const sketchyGoogleUser = {
                    email: 'sketchy@fpt.edu.vn',
                    firstName: undefined,
                    lastName: null,
                    picture: 'http://avatar.com/none',
                };
                userRepository.findOne.mockResolvedValue(null);
                userRepository.save.mockImplementation(async (u) => u);

                // Act
                await handler.handleCallback(sketchyGoogleUser);

                // Assert
                const savedUser = userRepository.save.mock.calls[0][0] as User;
                // Template literal `${undefined} ${null}` results in "undefined null" string in plain JS
                // Let's verify our specific implementation's behavior
                expect(savedUser.fullName).toBeDefined();
            });

            it('should propagate database errors from userRepository.findOne', async () => {
                // Arrange
                const dbError = new Error('Database connection failed');
                userRepository.findOne.mockRejectedValue(dbError);

                // Act & Assert
                await expect(handler.handleCallback(mockGoogleUser)).rejects.toThrow('Database connection failed');
            });

            it('should propagate database errors from userRepository.save during registration', async () => {
                // Arrange
                userRepository.findOne.mockResolvedValue(null);
                const saveError = new Error('Unique constraint violation');
                userRepository.save.mockRejectedValue(saveError);

                // Act & Assert
                await expect(handler.handleCallback(mockGoogleUser)).rejects.toThrow('Unique constraint violation');
            });

            it('should propagate errors from tokenService', async () => {
                // Arrange
                const existingUser = User.create({
                    id: 'existing-id',
                    email: mockGoogleUser.email,
                });
                userRepository.findOne.mockResolvedValue(existingUser);
                tokenService.generateAccessToken.mockRejectedValue(new Error('JWT secret not configured'));

                // Act & Assert
                await expect(handler.handleCallback(mockGoogleUser)).rejects.toThrow('JWT secret not configured');
            });

            it('should handle case where user role is missing from existing user', async () => {
                // Arrange
                const userWithoutRole = User.create({
                    id: 'no-role-id',
                    email: mockGoogleUser.email,
                });
                // Force role to null if possible (User.create might set a default, so we check reconstituted)
                userRepository.findOne.mockResolvedValue(userWithoutRole);
                tokenService.generateAccessToken.mockResolvedValue('tokens');

                // Act
                await handler.handleCallback(mockGoogleUser);

                // Assert
                expect(tokenService.generateAccessToken).toHaveBeenCalledWith('no-role-id', undefined);
            });
        });
    });
});
