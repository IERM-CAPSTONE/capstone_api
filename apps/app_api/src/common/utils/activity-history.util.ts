import { PrismaService } from '@app/prisma';
import { ActivityType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export interface ActivityHistoryPayload {
    event: string;
    title: string;
    message: string;
    meta?: Record<string, any>;
}

export interface LogActivityInput {
    sessionId: string;
    activityType: ActivityType;
    payload: ActivityHistoryPayload;
    ticketId?: string;
    actorId?: string;
    fromAssigneeId?: string;
    toAssigneeId?: string;
    note?: string;
}

export async function logSessionActivity(
    prisma: PrismaService,
    input: LogActivityInput,
): Promise<void> {
    try {
        await (prisma as any).activityHistory.create({
            data: {
                id: uuidv4(),
                // This legacy table uses studentExamId as a generic scope key.
                studentExamId: input.sessionId,
                ticketId: input.ticketId || uuidv4(),
                activityType: input.activityType,
                description: JSON.stringify(input.payload),
                actorId: input.actorId,
                fromAssigneeId: input.fromAssigneeId,
                toAssigneeId: input.toAssigneeId,
                note: input.note,
            },
        });
    } catch (error) {
        // Do not block business flow if monitoring log write fails.
        // eslint-disable-next-line no-console
        console.warn('[WARN] Failed to log session activity:', (error as Error)?.message || error);
    }
}

export function parseActivityDescription(description: string): ActivityHistoryPayload {
    try {
        const parsed = JSON.parse(description);
        if (parsed && typeof parsed === 'object') {
            return {
                event: String(parsed.event || 'UNKNOWN_EVENT'),
                title: String(parsed.title || 'Activity'),
                message: String(parsed.message || ''),
                meta: parsed.meta && typeof parsed.meta === 'object' ? parsed.meta : undefined,
            };
        }
    } catch {
        // fallback below
    }

    return {
        event: 'LEGACY_ACTIVITY',
        title: 'Activity',
        message: description,
    };
}
