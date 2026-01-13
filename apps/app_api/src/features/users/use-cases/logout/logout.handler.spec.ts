import { Test, TestingModule } from '@nestjs/testing';
import { LogoutHandler } from './logout.handler';
import { TokenService } from '@app/users';
import { Response } from 'express';

describe('LogoutHandler', () => {
    let handler: LogoutHandler;
    let tokenService: jest.Mocked<TokenService>;

    beforeEach(async () => {
        const mockTokenService = {
            clearCookies: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                LogoutHandler,
                { provide: TokenService, useValue: mockTokenService },
            ],
        }).compile();

        handler = module.get<LogoutHandler>(LogoutHandler);
        tokenService = module.get(TokenService);
    });

    describe('handleLogout', () => {
        it('should call clearCookies on tokenService', async () => {
            // Arrange
            const mockResponse = {
                clearCookie: jest.fn(),
            } as unknown as Response;

            // Act
            await handler.handleLogout(mockResponse);

            // Assert
            expect(tokenService.clearCookies).toHaveBeenCalledWith(mockResponse);
        });
    });
});
