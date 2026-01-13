import { Test, TestingModule } from '@nestjs/testing';
import { RefreshTokenHandler } from './refresh-token.handler';
import { TokenService, USER_REPOSITORY, IUserRepository, User, RoleType } from '@app/users';
import { UnauthorizedException } from '@nestjs/common';

describe('RefreshTokenHandler', () => {
    let handler: RefreshTokenHandler;
    let userRepository: jest.Mocked<IUserRepository>;
    let tokenService: jest.Mocked<TokenService>;

    const userId = 'user-uuid';
    const mockUser = User.create({
        id: userId,
        email: 'test@fpt.edu.vn',
        role: RoleType.STUDENT,
    });

    beforeEach(async () => {
        const mockRepo = {
            findOne: jest.fn(),
        };

        const mockTokenService = {
            generateAccessToken: jest.fn(),
            generateRefreshToken: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                RefreshTokenHandler,
                { provide: USER_REPOSITORY, useValue: mockRepo },
                { provide: TokenService, useValue: mockTokenService },
            ],
        }).compile();

        handler = module.get<RefreshTokenHandler>(RefreshTokenHandler);
        userRepository = module.get(USER_REPOSITORY);
        tokenService = module.get(TokenService);
    });

    describe('handleRefresh', () => {
        it('should generate new tokens successfully', async () => {
            // Arrange
            userRepository.findOne.mockResolvedValue(mockUser);
            tokenService.generateAccessToken.mockResolvedValue('new-access');
            tokenService.generateRefreshToken.mockResolvedValue('new-refresh');

            // Act
            const result = await handler.handleRefresh(userId);

            // Assert
            expect(userRepository.findOne).toHaveBeenCalledWith({ id: userId });
            expect(tokenService.generateAccessToken).toHaveBeenCalledWith(userId, RoleType.STUDENT);
            expect(tokenService.generateRefreshToken).toHaveBeenCalledWith(userId);
            expect(result.accessToken).toBe('new-access');
            expect(result.refreshToken).toBe('new-refresh');
        });

        it('should throw UnauthorizedException if user not found', async () => {
            // Arrange
            userRepository.findOne.mockResolvedValue(null);

            // Act & Assert
            await expect(handler.handleRefresh(userId))
                .rejects.toThrow(UnauthorizedException);
        });

        it('should propagate errors from tokenService', async () => {
            // Arrange
            userRepository.findOne.mockResolvedValue(mockUser);
            tokenService.generateAccessToken.mockRejectedValue(new Error('Token error'));

            // Act & Assert
            await expect(handler.handleRefresh(userId)).rejects.toThrow('Token error');
        });
    });
});
