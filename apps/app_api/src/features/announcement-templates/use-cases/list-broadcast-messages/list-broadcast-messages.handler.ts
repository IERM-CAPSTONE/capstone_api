import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { BroadcastMessageItem, ListBroadcastMessagesQueryDto } from './list-broadcast-messages.dto';

@Injectable()
export class ListBroadcastMessagesHandler {
    constructor(private readonly prisma: PrismaService) {}

    async execute(userId: string, query: ListBroadcastMessagesQueryDto): Promise<BroadcastMessageItem[]> {
        const requestedSubjects = (query.subjectCodes || '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);

        const rows = await this.prisma.notification.findMany({
            where: {
                toUserId: userId,
                channel: 'IN_APP',
            },
            orderBy: { createdAt: 'desc' },
            take: Math.max((query.limit ?? 50) * 2, 100),
        });

        const mapped = rows
            .map((row) => {
                const meta = (row.meta || {}) as any;
                if (meta?.eventType !== 'BROADCAST_ANNOUNCEMENT') return null;

                const subjectCodes = Array.isArray(meta?.subjectCodes)
                    ? meta.subjectCodes.map((s: any) => String(s))
                    : [];

                if (
                    requestedSubjects.length > 0 &&
                    !subjectCodes.some((s: string) => requestedSubjects.includes(s))
                ) {
                    return null;
                }

                return {
                    id: row.id,
                    title: row.title,
                    content: row.message,
                    type: String(meta?.type || 'INFO'),
                    createdAt: row.createdAt,
                    senderName: meta?.senderName || null,
                    subjectCodes,
                    deliveries: Array.isArray(meta?.deliveries) ? meta.deliveries : [],
                } as BroadcastMessageItem;
            })
            .filter(Boolean) as BroadcastMessageItem[];

        return mapped.slice(0, query.limit ?? 50);
    }
}
