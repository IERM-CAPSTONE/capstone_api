import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@app/prisma';
import { getMessaging } from 'firebase-admin/messaging';
import { ensureFirebaseAdminInitialized } from '../firebase/firebase-admin.helper';

type PushMessageInput = {
    title: string;
    body: string;
    data?: Record<string, string | number | boolean | null | undefined>;
};

const MAX_TOKENS_PER_BATCH = 500;

@Injectable()
export class FcmService {
    private readonly logger = new Logger(FcmService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) { }

    async sendToUser(userId: string, message: PushMessageInput): Promise<{
        attempted: number;
        sent: number;
        failed: number;
    }> {
        try {
            ensureFirebaseAdminInitialized(this.configService, this.logger);
        } catch (error) {
            this.logger.warn(`Skipping FCM send: ${(error as Error).message}`);
            return { attempted: 0, sent: 0, failed: 0 };
        }

        const tokens = await (this.prisma as any).pushToken.findMany({
            where: {
                userId,
                isActive: true,
            },
            select: {
                token: true,
            },
        });

        const tokenList: string[] = tokens
            .map((item: { token?: string | null }) => item.token)
            .filter((token): token is string => typeof token === 'string' && token.trim().length > 0);

        if (tokenList.length === 0) {
            this.logger.log(`No active push tokens found for user ${userId}`);
            return { attempted: 0, sent: 0, failed: 0 };
        }

        const data = this.normalizeData(message.data);
        const chunks = this.chunk(tokenList, MAX_TOKENS_PER_BATCH);

        let sent = 0;
        let failed = 0;
        const invalidTokens = new Set<string>();

        for (const chunk of chunks) {
            const response = await getMessaging().sendEachForMulticast({
                tokens: chunk,
                notification: {
                    title: message.title,
                    body: message.body,
                },
                data,
            });

            sent += response.successCount;
            failed += response.failureCount;

            response.responses.forEach((item, index) => {
                if (!item.success) {
                    const code = (item.error as any)?.code as string | undefined;
                    if (code && this.isInvalidTokenError(code)) {
                        invalidTokens.add(chunk[index]);
                    }
                }
            });
        }

        if (invalidTokens.size > 0) {
            await (this.prisma as any).pushToken.updateMany({
                where: {
                    token: { in: Array.from(invalidTokens) },
                },
                data: {
                    isActive: false,
                },
            });
        }

        this.logger.log(
            `FCM send for user ${userId}: attempted=${tokenList.length}, sent=${sent}, failed=${failed}, invalid=${invalidTokens.size}`,
        );

        return {
            attempted: tokenList.length,
            sent,
            failed,
        };
    }

    private normalizeData(
        data?: Record<string, string | number | boolean | null | undefined>,
    ): Record<string, string> | undefined {
        if (!data) {
            return undefined;
        }

        const normalized = Object.fromEntries(
            Object.entries(data)
                .filter(([, value]) => value !== undefined && value !== null)
                .map(([key, value]) => [key, String(value)]),
        );

        return Object.keys(normalized).length > 0 ? normalized : undefined;
    }

    private isInvalidTokenError(code: string): boolean {
        return [
            'messaging/registration-token-not-registered',
            'messaging/invalid-registration-token',
            'messaging/invalid-argument',
        ].includes(code);
    }

    private chunk<T>(items: T[], size: number): T[][] {
        const result: T[][] = [];
        for (let i = 0; i < items.length; i += size) {
            result.push(items.slice(i, i + size));
        }
        return result;
    }
}
