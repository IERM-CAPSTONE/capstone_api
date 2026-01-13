import { Test, TestingModule } from '@nestjs/testing';
import { TestTokenHandler } from './test-token.handler';
import { TokenService, RoleType } from '@app/users';

describe('TestTokenHandler', () => {
    let handler: TestTokenHandler;
    let tokenService: jest.Mocked<TokenService>;

    beforeEach(async () => {
        const mockTokenService = {
            generateAccessToken: jest.fn(),
            generateRefreshToken: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TestTokenHandler,
                { provide: TokenService, useValue: mockTokenService },
            ],
        }).compile();

        handler = module.get<TestTokenHandler>(TestTokenHandler);
        tokenService = module.get(TokenService);
    });

    describe('execute', () => {
        it('should generate tokens for a given role and userId', async () => {
            // Arrange
            const dto = { role: RoleType.ADMIN, userId: 'custom-id' };
            tokenService.generateAccessToken.mockResolvedValue('access');
            tokenService.generateRefreshToken.mockResolvedValue('refresh');

            // Act
            const result = await handler.execute(dto);

            // Assert
            expect(tokenService.generateAccessToken).toHaveBeenCalledWith('custom-id', RoleType.ADMIN);
            expect(tokenService.generateRefreshToken).toHaveBeenCalledWith('custom-id');
            expect(result.accessToken).toBe('access');
            expect(result.refreshToken).toBe('refresh');
        });

        it('should use default userId if not provided', async () => {
            // Arrange
            const dto = { role: RoleType.STUDENT };
            tokenService.generateAccessToken.mockResolvedValue('access');
            tokenService.generateRefreshToken.mockResolvedValue('refresh');

            // Act
            await handler.execute(dto);

            // Assert
            expect(tokenService.generateAccessToken).toHaveBeenCalledWith('test-user-id', RoleType.STUDENT);
        });
    });
});
