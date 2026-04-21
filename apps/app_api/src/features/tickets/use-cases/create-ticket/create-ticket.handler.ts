import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@app/prisma';
import { TICKET_REPOSITORY, ITicketRepository } from '@app/tickets';
import { CreateTicketDto } from './create-ticket.dto';
import { NotificationGateway } from '../../../../common/gateways/notification.gateway';
import { FcmService } from '../../../../common/fcm/fcm.service';

@Injectable()
export class CreateTicketHandler {
    constructor(
        @Inject(TICKET_REPOSITORY)
        private readonly ticketRepository: ITicketRepository,
        private readonly prisma: PrismaService,
        private readonly notificationGateway: NotificationGateway,
        private readonly fcmService: FcmService,
    ) { }

    async execute(dto: CreateTicketDto, reporterId: string): Promise<any> {
        // Temporary bypass: allow ticket creation regardless of exam time window.
        if (!dto.sessionId) {
            throw new BadRequestException('sessionId is required to create a ticket');
        }

        const session = await this.prisma.examSession.findUnique({
            where: { id: dto.sessionId },
            select: { 
                examOpenTime: true, 
                examCloseTime: true, 
                campus: true,
                hallInvigilatorId: true,
            },
        });

        if (!session) {
            throw new BadRequestException(`Exam session ${dto.sessionId} not found`);
        }

        const confirmedAssignmentType =
            dto.confirmedAssignmentType ??
            ((dto.aiRecommendedAssignmentType === 'EXAM_OFFICER' || dto.aiRecommendedAssignmentType === 'HALL_INVIGILATOR')
                ? dto.aiRecommendedAssignmentType
                : 'HALL_INVIGILATOR');

        // 1.5 Resolve assignee based on confirmedAssignmentType
        let assigneeId: string | undefined = undefined;
        let assignmentResolution = 'unassigned';

        if (confirmedAssignmentType === 'HALL_INVIGILATOR') {
            assigneeId = session.hallInvigilatorId ?? undefined;
            assignmentResolution = assigneeId
                ? 'hall_invigilator_session'
                : 'hall_invigilator_missing';
        } else if (confirmedAssignmentType === 'EXAM_OFFICER') {
            if (session.campus) {
                const officers = await this.prisma.user.findMany({
                    where: {
                        role: 'EXAM_OFFICER',
                        campus: session.campus,
                    },
                    select: {
                        id: true,
                        assignedTickets: {
                            where: {
                                status: { in: ['OPEN', 'IN_PROGRESS'] },
                            },
                            select: { id: true },
                        },
                    },
                });

                if (officers.length > 0) {
                    const leastLoaded = officers.reduce((prev, current) =>
                        current.assignedTickets.length < prev.assignedTickets.length ? current : prev,
                    );
                    assigneeId = leastLoaded.id;
                    assignmentResolution = 'least_loaded_exam_officer';
                } else {
                    assignmentResolution = 'exam_officer_not_found';
                }
            } else {
                assignmentResolution = 'campus_missing';
            }
        }

        // 1. Create the ticket
        const ticket = await this.ticketRepository.save({
            id: undefined,
            issueName: dto.issueName,
            issueType: dto.issueType,
            description: dto.description,
            priority: dto.priority ?? 'Normal',
            status: 'OPEN',
            reporterId,
            assigneeId,
            sessionId: dto.sessionId,
            attachment: dto.attachment,
            studentCode: dto.studentCode,
            ocrText: dto.ocrText,
            aiPredictedIssueName: dto.aiPredictedIssueName,
            aiPredictedIssueType: dto.aiPredictedIssueType,
            aiConfidence: dto.aiConfidence,
            aiDisplayMessage: dto.aiDisplayMessage,
            aiEvidenceText: dto.aiEvidenceText,
            aiModelVersion: dto.aiModelVersion,
            aiRecommendedAssignmentType: dto.aiRecommendedAssignmentType,
            confirmedAssignmentType,
        });


        // 2. Fetch reporter info
        const reporter = await this.prisma.user.findUnique({
            where: { id: reporterId },
            select: { fullName: true, role: true },
        });

        // 3. Emit real-time WebSocket events
        //    - ticket:created is a SILENT event for list refresh only (not a user notification)
        //    - monitor:ticket_count_changed for dashboard updates
        const sessionCampus = session?.campus;
        if (sessionCampus) {
            this.notificationGateway.sendToCampus(sessionCampus, 'ticket:created', {
                ticket,
                reporter: reporter ?? null,
                isUserNotification: false,
            });
            this.notificationGateway.sendToCampus(sessionCampus, 'monitor:ticket_count_changed', {
                ticketId: ticket.id,
                sessionId: ticket.sessionId,
                campus: sessionCampus,
                action: 'created',
                status: 'OPEN',
            });
        } else {
            this.notificationGateway.sendToAll('ticket:created', {
                ticket,
                reporter: reporter ?? null,
                isUserNotification: false,
            });
            this.notificationGateway.sendToAll('monitor:ticket_count_changed', {
                ticketId: ticket.id,
                sessionId: ticket.sessionId,
                action: 'created',
                status: 'OPEN',
            });
        }

        await this.prisma.activityHistory.create({
            data: {
                id: uuidv4(),
                ticketId: ticket.id,
                activityType: 'TICKET_CREATED' as any,
                description: JSON.stringify({
                    event: 'TICKET_CREATED',
                    title: 'Ticket Created',
                    message: `${reporter?.fullName ?? 'Staff'} created ticket ${ticket.issueName}`,
                    meta: {
                        ticketId: ticket.id,
                        issueName: ticket.issueName,
                        issueType: ticket.issueType,
                        priority: ticket.priority,
                        reporterName: reporter?.fullName ?? null,
                        confirmedAssignmentType,
                        aiRecommendedAssignmentType: dto.aiRecommendedAssignmentType ?? null,
                        resolvedAssigneeId: assigneeId ?? null,
                        assignmentResolution,
                    },
                }),
                actorId: reporterId,
            } as any,
        });

        // 4. If ticket was assigned during creation, send notification to assignee
        if (assigneeId) {
            // Create DB notification
            await this.prisma.notification.create({
                data: {
                    id: uuidv4(),
                    toUserId: assigneeId,
                    fromId: reporterId,
                    title: `New ticket assigned: ${ticket.issueName}`,
                    message: `${reporter?.fullName ?? 'Staff'} created and assigned you a ticket.`,
                    channel: 'IN_APP',
                    meta: { 
                        ticketId: ticket.id, 
                        action: 'auto_assigned',
                        assignmentType: confirmedAssignmentType,
                    },
                },
            });

            // Send WebSocket notification
            this.notificationGateway.sendToUser(assigneeId, 'ticket:assigned', {
                ticketId: ticket.id,
                assigneeId,
                issueName: ticket.issueName,
                studentCode: ticket.studentCode ?? null,
                actorName: reporter?.fullName ?? 'Staff',
                reporterId,
                note: `Auto-assigned based on ${confirmedAssignmentType}`,
                action: 'auto_assigned',
                isUserNotification: true,
            });

            // Send FCM push notification
            await this.fcmService.sendToUser(assigneeId, {
                title: `New ticket assigned: ${ticket.issueName}`,
                body: `${reporter?.fullName ?? 'Staff'} created and assigned you a ticket.`,
                data: {
                    type: 'ticket_assigned',
                    ticketId: ticket.id,
                    assigneeId,
                    issueName: ticket.issueName,
                    studentCode: ticket.studentCode ?? '',
                    reporterId,
                    actorId: reporterId,
                    actorName: reporter?.fullName ?? 'Staff',
                    action: 'auto_assigned',
                },
            });
        }

        return ticket;
    }
}
