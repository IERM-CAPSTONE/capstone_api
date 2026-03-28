import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { parseActivityDescription } from '../../../../common/utils/activity-history.util';
import { MonitorActivitiesQueryDto, SessionActivityItem } from './monitor-activities.dto';

@Injectable()
export class MonitorActivitiesHandler {
    constructor(private readonly prisma: PrismaService) {}

    async execute(sessionId: string, query: MonitorActivitiesQueryDto): Promise<SessionActivityItem[]> {
        const limit = query.limit ?? 50;

        const rows = await (this.prisma as any).activityHistory.findMany({
            where: {
                studentExamId: sessionId,
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return rows.map((row: any) => {
            const parsed = parseActivityDescription(String(row.description || ''));
            return {
                id: row.id,
                activityType: row.activityType,
                event: parsed.event,
                title: parsed.title,
                message: parsed.message,
                ticketId: row.ticketId,
                createdAt: row.createdAt,
                meta: parsed.meta,
            };
        });
    }
}
