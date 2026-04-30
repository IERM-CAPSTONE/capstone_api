import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { RegisterPushTokenDto } from './register-push-token.dto';
import { RemovePushTokenDto } from './remove-push-token.dto';

@Injectable()
export class PushTokensHandler {
    private readonly logger = new Logger(PushTokensHandler.name);

    constructor(private readonly prisma: PrismaService) { }

    private isMissingPushTokenTableError(error: unknown): boolean {
        const e = error as { code?: string; message?: string };
        const message = e?.message ?? '';
        return e?.code === 'P2021' && /PushToken|pushToken|public\.PushToken/i.test(message);
    }

    async register(userId: string, dto: RegisterPushTokenDto): Promise<any> {
        const token = (dto.token ?? '').trim();
        const deviceId = dto.deviceId?.trim() || null;
        const platform = dto.platform?.trim() || null;

        if (!token) {
            throw new BadRequestException('token is required');
        }

        try {
            if (deviceId) {
                await (this.prisma as any).pushToken.updateMany({
                    where: {
                        userId,
                        deviceId,
                        token: { not: token },
                        isActive: true,
                    },
                    data: {
                        isActive: false,
                    },
                });
            }

            const existing = await (this.prisma as any).pushToken.findUnique({
                where: { token },
            });

            const saved = existing
                ? await (this.prisma as any).pushToken.update({
                    where: { token },
                    data: {
                        userId,
                        deviceId,
                        platform,
                        isActive: true,
                        lastSeenAt: new Date(),
                    },
                })
                : await (this.prisma as any).pushToken.create({
                    data: {
                        userId,
                        deviceId,
                        token,
                        platform,
                        isActive: true,
                        lastSeenAt: new Date(),
                    },
                });

            const activeCount = await (this.prisma as any).pushToken.count({
                where: {
                    userId,
                    isActive: true,
                },
            });

            return {
                success: true,
                tokenId: saved.id,
                deviceId: saved.deviceId,
                platform: saved.platform,
                activeCount,
                updatedAt: saved.updatedAt,
            };
        } catch (error) {
            if (this.isMissingPushTokenTableError(error)) {
                this.logger.warn('PushToken table is missing. Skip token registration until migrations are applied.');
                return {
                    success: true,
                    skipped: true,
                    reason: 'PUSH_TOKEN_TABLE_MISSING',
                };
            }
            throw error;
        }
    }

    async remove(userId: string, dto: RemovePushTokenDto): Promise<any> {
        const token = dto.token?.trim() || null;
        const deviceId = dto.deviceId?.trim() || null;

        if (!token && !deviceId) {
            throw new BadRequestException('token or deviceId is required');
        }

        try {
            const result = await (this.prisma as any).pushToken.updateMany({
                where: {
                    userId,
                    ...(token ? { token } : {}),
                    ...(deviceId ? { deviceId } : {}),
                    isActive: true,
                },
                data: {
                    isActive: false,
                },
            });

            return {
                success: true,
                deactivatedCount: result.count,
            };
        } catch (error) {
            if (this.isMissingPushTokenTableError(error)) {
                this.logger.warn('PushToken table is missing. Skip token deactivation until migrations are applied.');
                return {
                    success: true,
                    deactivatedCount: 0,
                    skipped: true,
                    reason: 'PUSH_TOKEN_TABLE_MISSING',
                };
            }
            throw error;
        }
    }
}
