import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { RegisterPushTokenDto } from './register-push-token.dto';
import { RemovePushTokenDto } from './remove-push-token.dto';

@Injectable()
export class PushTokensHandler {
    constructor(private readonly prisma: PrismaService) { }

    async register(userId: string, dto: RegisterPushTokenDto): Promise<any> {
        const token = (dto.token ?? '').trim();
        const deviceId = dto.deviceId?.trim() || null;
        const platform = dto.platform?.trim() || null;

        if (!token) {
            throw new BadRequestException('token is required');
        }

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
    }

    async remove(userId: string, dto: RemovePushTokenDto): Promise<any> {
        const token = dto.token?.trim() || null;
        const deviceId = dto.deviceId?.trim() || null;

        if (!token && !deviceId) {
            throw new BadRequestException('token or deviceId is required');
        }

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
    }
}
