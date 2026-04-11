import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { NotificationGateway } from '../../../../common/gateways/notification.gateway';
import { FcmService } from '../../../../common/fcm/fcm.service';
import { AnnouncementType, ExamSessionStatus } from '@prisma/client';
import { logSessionActivity } from '../../../../common/utils/activity-history.util';
import { v4 as uuidv4 } from 'uuid';

export interface BroadcastAnnouncementCommand {
    subjectCodes: string[];
    content: string;
    type: AnnouncementType;
    title?: string;
    senderId?: string;
    senderName?: string;
}

export interface BroadcastDeliveryItem {
    sessionId: string;
    subjectCode: string;
    roomNumber: string;
    campus: string;
}

@Injectable()
export class BroadcastAnnouncementHandler {
    private readonly logger = new Logger(BroadcastAnnouncementHandler.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly gateway: NotificationGateway,
        private readonly fcmService: FcmService,
    ) { }

    async execute(command: BroadcastAnnouncementCommand): Promise<{ success: boolean; count: number; deliveries: BroadcastDeliveryItem[]; sentAt: string }> {
        this.logger.log(`Broadcasting announcement to subjects: ${command.subjectCodes.join(', ')}`);

        // 1. Find all active/upcoming exam sessions for these subjects
        const sessions = await this.prisma.examSession.findMany({
            where: {
                subjectCode: { in: command.subjectCodes },
                status: { in: [ExamSessionStatus.Ongoing, ExamSessionStatus.Scheduled] },
            },
            select: {
                id: true,
                proctorId: true,
                hallInvigilatorId: true,
                subjectCode: true,
                examRoom: {
                    select: {
                        roomNumber: true,
                    },
                },
                campus: true,
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

        const sessionCampuses = Array.from(new Set(sessions.map((s) => s.campus)));
        if (sessionCampuses.length > 0) {
            const examOfficers = await this.prisma.user.findMany({
                where: {
                    role: 'EXAM_OFFICER',
                    campus: { in: sessionCampuses as any },
                },
                select: {
                    id: true,
                },
            });

            const deliveriesForMeta = sessions.map((session) => ({
                sessionId: session.id,
                subjectCode: session.subjectCode,
                roomNumber: session.examRoom?.roomNumber ?? 'N/A',
                campus: String(session.campus),
            }));

            if (examOfficers.length > 0) {
                await this.prisma.notification.createMany({
                    data: examOfficers.map((officer) => ({
                        id: uuidv4(),
                        toUserId: officer.id,
                        fromId: command.senderId || null,
                        title: command.title || 'Official Announcement',
                        message: command.content,
                        channel: 'IN_APP',
                        meta: {
                            eventType: 'BROADCAST_ANNOUNCEMENT',
                            type: command.type,
                            senderId: command.senderId ?? null,
                            senderName: command.senderName ?? null,
                            subjectCodes: command.subjectCodes,
                            deliveries: deliveriesForMeta,
                            sentAt: notificationData.sentAt,
                        },
                    })),
                });
            }

            examOfficers.forEach((officer) => {
                this.gateway.sendToUser(officer.id, 'monitor:broadcast_sent', {
                    title: command.title || 'Official Announcement',
                    message: command.content,
                    type: command.type,
                    sentAt: notificationData.sentAt,
                    deliveries: deliveriesForMeta,
                });
            });
        }

        // 4. Persist notifications and send mobile push for session staff (proctors + hall invigilators)
        const staffIds = Array.from(
            new Set(
                sessions.flatMap((session) => [session.proctorId, session.hallInvigilatorId])
                    .filter((id): id is string => id !== null),
            ),
        );

        if (staffIds.length > 0) {
            const deliveriesForStaffMeta = sessions.map((session) => ({
                sessionId: session.id,
                subjectCode: session.subjectCode,
                roomNumber: session.examRoom?.roomNumber ?? 'N/A',
                campus: String(session.campus),
            }));

            const staffNotifications = [];
            staffIds.forEach((staffId) => {
                staffNotifications.push({
                    id: uuidv4(),
                    toUserId: staffId,
                    fromId: command.senderId || null,
                    title: command.title || 'Official Announcement',
                    message: command.content,
                    channel: 'PUSH_APP',
                    meta: {
                        eventType: 'BROADCAST_ANNOUNCEMENT',
                        type: command.type,
                        senderId: command.senderId ?? null,
                        senderName: command.senderName ?? null,
                        subjectCodes: command.subjectCodes,
                        deliveries: deliveriesForStaffMeta,
                        sentAt: notificationData.sentAt,
                    },
                });
                staffNotifications.push({
                    id: uuidv4(),
                    toUserId: staffId,
                    fromId: command.senderId || null,
                    title: command.title || 'Official Announcement',
                    message: command.content,
                    channel: 'IN_APP',
                    meta: {
                        eventType: 'BROADCAST_ANNOUNCEMENT',
                        type: command.type,
                        senderId: command.senderId ?? null,
                        senderName: command.senderName ?? null,
                        subjectCodes: command.subjectCodes,
                        deliveries: deliveriesForStaffMeta,
                        sentAt: notificationData.sentAt,
                    },
                });
            });

            if (staffNotifications.length > 0) {
                await this.prisma.notification.createMany({
                    data: staffNotifications,
                });
            }

            await Promise.all(
                staffIds.map((staffId) =>
                    this.fcmService.sendToUser(staffId, {
                        title: command.title || 'Official Announcement',
                        body: command.content,
                        data: {
                            type: 'broadcast_announcement',
                            sentAt: notificationData.sentAt,
                            subjectCodes: command.subjectCodes.join(','),
                        },
                    }),
                ),
            );
        }

        await Promise.all(
            sessions.map((session) =>
                logSessionActivity(this.prisma, {
                    sessionId: session.id,
                    activityType: 'MOVED',
                    payload: {
                        event: 'BROADCAST_SENT',
                        title: command.title || 'Official Announcement',
                        message: command.content,
                        meta: {
                            senderId: command.senderId ?? null,
                            senderName: command.senderName ?? null,
                            type: command.type,
                            subjectCode: session.subjectCode,
                            roomNumber: session.examRoom?.roomNumber ?? 'N/A',
                            campus: session.campus,
                        },
                    },
                }),
            ),
        );

        const deliveries: BroadcastDeliveryItem[] = sessions.map((session) => ({
            sessionId: session.id,
            subjectCode: session.subjectCode,
            roomNumber: session.examRoom?.roomNumber ?? 'N/A',
            campus: String(session.campus),
        }));

        return {
            success: true,
            count: targets.length,
            deliveries,
            sentAt: notificationData.sentAt,
        };
    }
}
