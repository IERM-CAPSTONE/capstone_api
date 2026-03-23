import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { NotificationGateway } from '../../../../common/gateways/notification.gateway';
import { AnnouncementType, ExamSessionStatus } from '@prisma/client';

export interface BroadcastAnnouncementCommand {
    subjectCodes: string[];
    content: string;
    type: AnnouncementType;
    title?: string;
}

@Injectable()
export class BroadcastAnnouncementHandler {
    private readonly logger = new Logger(BroadcastAnnouncementHandler.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly gateway: NotificationGateway,
    ) { }

    async execute(command: BroadcastAnnouncementCommand): Promise<{ success: boolean; count: number }> {
        this.logger.log(`Broadcasting announcement to subjects: ${command.subjectCodes.join(', ')}`);

        // 1. Find all ongoing exam sessions for these subjects
        const sessions = await this.prisma.examSession.findMany({
            where: {
                subjectCode: { in: command.subjectCodes },
                status: ExamSessionStatus.Ongoing,
            },
            select: {
                id: true,
                proctorId: true,
                hallInvigilatorId: true,
                subjectCode: true,
                examRoomId: true,
            }
        });

        // 2. Identify unique proctors/staff to notify
        const userIds = new Set<string>();
        sessions.forEach(s => {
            if (s.proctorId) userIds.add(s.proctorId);
            if (s.hallInvigilatorId) userIds.add(s.hallInvigilatorId);
        });

        const targets = Array.from(userIds);
        this.logger.log(`Found ${sessions.length} sessions, sending to ${targets.length} staff members`);

        // 3. Emit socket notification for each target
        const notificationData = {
            title: command.title || 'Official Announcement',
            message: command.content,
            type: command.type,
            sentAt: new Date().toISOString()
        };

        targets.forEach(userId => {
            this.gateway.sendToUser(userId, 'broadcast_announcement', notificationData);
        });

        return {
            success: true,
            count: targets.length
        };
    }
}
