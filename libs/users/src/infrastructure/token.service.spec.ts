import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';
import { Response } from 'express';

describe('TokenService', () => {
    let service: TokenService;
    let jwtService: jest.Mocked<JwtService>;
    let configService: jest.Mocked<ConfigService>;

    beforeEach(async () => {
        const mockJwtService = {
            signAsync: jest.fn(),
        };
        const mockConfigService = {
            get: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                TokenService,
                { provide: JwtService, useValue: mockJwtService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<TokenService>(TokenService);
        jwtService = module.get(JwtService);
        configService = module.get(ConfigService);
    });

    describe('generateAccessToken', () => {
        it('should generate an access token with correct payload', async () => {
            configService.get.mockImplementation((key) => {
                if (key === 'JWT_ACCESS_SECRET') return 'secret';
                if (key === 'JWT_ACCESS_EXPIRATION') return '15m';
                return null;
            });
            jwtService.signAsync.mockResolvedValue('access-token');

            const token = await service.generateAccessToken('user-id', 'ADMIN');

            expect(jwtService.signAsync).toHaveBeenCalledWith(
                { sub: 'user-id', role: 'ADMIN' },
                { secret: 'secret', expiresIn: '15m' }
            );
            expect(token).toBe('access-token');
        });
    });

    describe('generateRefreshToken', () => {
        it('should generate a refresh token', async () => {
            configService.get.mockImplementation((key) => {
                if (key === 'JWT_REFRESH_SECRET') return 'refresh-secret';
                if (key === 'JWT_REFRESH_EXPIRATION') return '7d';
                return null;
            });
            jwtService.signAsync.mockResolvedValue('refresh-token');

            const token = await service.generateRefreshToken('user-id');

            expect(jwtService.signAsync).toHaveBeenCalledWith(
                { sub: 'user-id' },
                { secret: 'refresh-secret', expiresIn: '7d' }
            );
            expect(token).toBe('refresh-token');
        });
    });

    describe('setCookies', () => {
        it('should set access and refresh tokens in cookies', () => {
            const mockRes = {
                cookie: jest.fn(),
            } as any;
            configService.get.mockReturnValue('development');

            service.setCookies(mockRes, 'access', 'refresh');

            expect(mockRes.cookie).toHaveBeenCalledTimes(2);
            expect(mockRes.cookie).toHaveBeenCalledWith('access_token', 'access', expect.objectContaining({
                httpOnly: true,
            }));
            expect(mockRes.cookie).toHaveBeenCalledWith('refresh_token', 'refresh', expect.objectContaining({
                httpOnly: true,
            }));
        });
    });

    describe('clearCookies', () => {
        it('should clear access and refresh token cookies', () => {
            const mockRes = {
                clearCookie: jest.fn(),
            } as any;

            service.clearCookies(mockRes);

            expect(mockRes.clearCookie).toHaveBeenCalledWith('access_token');
            expect(mockRes.clearCookie).toHaveBeenCalledWith('refresh_token');
        });
    });
});
