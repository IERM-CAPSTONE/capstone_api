import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IProctorApplicationRepository, PROCTOR_APPLICATION_REPOSITORY } from '@app/proctor-applications';
import { PrismaService } from '@app/prisma';
import { v4 as uuidv4 } from 'uuid';
import { ProctorApplicationResponse, toProctorApplicationResponse } from '../../shared/proctor-application.response';
import { UpdateProctorApplicationStatusDto } from './update-status.dto';
import { NotificationGateway } from '../../../../common/gateways/notification.gateway';

@Injectable()
export class UpdateProctorApplicationStatusHandler {
    constructor(
        @Inject(PROCTOR_APPLICATION_REPOSITORY)
        private readonly repository: IProctorApplicationRepository,
        private readonly prisma: PrismaService,
        private readonly notificationGateway: NotificationGateway,
    ) { }

    async execute(id: string, dto: UpdateProctorApplicationStatusDto, actorUserId: string): Promise<ProctorApplicationResponse> {
        const application = await this.repository.findById(id);
        if (!application) {
            throw new NotFoundException('Application not found');
        }

        if (application.targetTeacherId !== actorUserId) {
            throw new ForbiddenException('Only the target assignee can respond to this swap request');
        }

        if (application.status !== 'PENDING') {
            throw new BadRequestException('This swap request has already been processed');
        }

        if (dto.status === 'APPROVED') {
            await this.applySwap(application, actorUserId);
        }

        const responseNote = dto.responseNote?.trim() || null;
        if (dto.status === 'REJECTED' && !responseNote) {
            throw new BadRequestException('A rejection reason is required');
        }

        const applicationWithResponseNote =
            dto.status === 'REJECTED'
                ? application.update({ notes: responseNote })
                : application;

        const updatedApplication = applicationWithResponseNote.updateStatus(dto.status);
        const saved = await this.repository.save(updatedApplication);
        const payload = toProctorApplicationResponse(saved);

        this.notificationGateway.sendToUser(saved.teacherId, 'proctor:application:updated', payload);
        if (saved.targetTeacherId && saved.targetTeacherId !== saved.teacherId) {
            this.notificationGateway.sendToUser(saved.targetTeacherId, 'proctor:application:updated', payload);
        }

        return payload;
    }

    private async applySwap(application: any, actorUserId: string): Promise<void> {
        if (!application.examSessionId || !application.targetExamSessionId || !application.targetTeacherId) {
            throw new BadRequestException('Swap request is missing session information');
        }

        const [sourceSession, targetSession] = await Promise.all([
            this.prisma.examSession.findUnique({
                where: { id: application.examSessionId },
                select: {
                    id: true,
                    proctorId: true,
                    hallInvigilatorId: true,
                    examOpenTime: true,
                    examCloseTime: true,
                },
            }),
            this.prisma.examSession.findUnique({
                where: { id: application.targetExamSessionId },
                select: {
                    id: true,
                    proctorId: true,
                    hallInvigilatorId: true,
                    examOpenTime: true,
                    examCloseTime: true,
                },
            }),
        ]);

        if (!sourceSession || !targetSession) {
            throw new NotFoundException('One or both exam sessions were not found');
        }

        const isHallSwap = application.preferredType === 'HALL';
        const sourceAssigneeId = isHallSwap ? sourceSession.hallInvigilatorId : sourceSession.proctorId;
        const targetAssigneeId = isHallSwap ? targetSession.hallInvigilatorId : targetSession.proctorId;
        const sourceAssignmentField = isHallSwap ? 'hallInvigilatorId' : 'proctorId';

        if (sourceAssigneeId !== application.teacherId) {
            throw new ConflictException('The requester is no longer assigned to the source session');
        }

        if (targetAssigneeId !== actorUserId) {
            throw new ConflictException('You are no longer assigned to the target session');
        }

        const [sourceClusterSessions, targetClusterSessions] = isHallSwap
            ? await Promise.all([
                this.getHallClusterSessions(application.teacherId, sourceSession.examOpenTime, sourceSession.examCloseTime),
                this.getHallClusterSessions(actorUserId, targetSession.examOpenTime, targetSession.examCloseTime),
            ])
            : [[sourceSession], [targetSession]];

        if (isHallSwap && (sourceClusterSessions.length === 0 || targetClusterSessions.length === 0)) {
            throw new ConflictException('One of the hall invigilator clusters is no longer available for swapping');
        }

        await Promise.all([
            isHallSwap
                ? this.ensureHallInvigilatorAvailability(
                    application.teacherId,
                    application.teacherName ? `giám thị hành lang ${application.teacherName}` : 'người gửi yêu cầu',
                    targetSession.examOpenTime,
                    targetSession.examCloseTime,
                    [...sourceClusterSessions.map((session) => session.id), ...targetClusterSessions.map((session) => session.id)],
                )
                : this.ensureProctorAvailability(
                    application.teacherId,
                    application.teacherName ? `giám thị ${application.teacherName}` : 'người gửi yêu cầu',
                    targetSession.examOpenTime,
                    targetSession.examCloseTime,
                    [sourceSession.id, targetSession.id],
                ),
            isHallSwap
                ? this.ensureHallInvigilatorAvailability(
                    actorUserId,
                    application.targetTeacherName ? `giám thị hành lang ${application.targetTeacherName}` : 'bạn',
                    sourceSession.examOpenTime,
                    sourceSession.examCloseTime,
                    [...sourceClusterSessions.map((session) => session.id), ...targetClusterSessions.map((session) => session.id)],
                )
                : this.ensureProctorAvailability(
                    actorUserId,
                    application.targetTeacherName ? `giám thị ${application.targetTeacherName}` : 'bạn',
                    sourceSession.examOpenTime,
                    sourceSession.examCloseTime,
                    [sourceSession.id, targetSession.id],
                ),
        ]);

        await this.prisma.$transaction(async (tx) => {
            if (isHallSwap) {
                await tx.examSession.updateMany({
                    where: { id: { in: sourceClusterSessions.map((session) => session.id) } },
                    data: { [sourceAssignmentField]: actorUserId } as any,
                });

                await tx.examSession.updateMany({
                    where: { id: { in: targetClusterSessions.map((session) => session.id) } },
                    data: { [sourceAssignmentField]: application.teacherId } as any,
                });
            } else {
                await tx.examSession.update({
                    where: { id: sourceSession.id },
                    data: { [sourceAssignmentField]: actorUserId } as any,
                });

                await tx.examSession.update({
                    where: { id: targetSession.id },
                    data: { [sourceAssignmentField]: application.teacherId } as any,
                });
            }

            if (!isHallSwap) {
                await tx.proctorAssignment.upsert({
                    where: {
                        proctorId_examSessionId: {
                            proctorId: actorUserId,
                            examSessionId: sourceSession.id,
                        },
                    },
                    update: {
                        status: 'SWAPPED',
                        assignedById: actorUserId,
                    },
                    create: {
                        id: uuidv4(),
                        proctorId: actorUserId,
                        examSessionId: sourceSession.id,
                        status: 'SWAPPED',
                        assignedById: actorUserId,
                    },
                });

                await tx.proctorAssignment.upsert({
                    where: {
                        proctorId_examSessionId: {
                            proctorId: application.teacherId,
                            examSessionId: targetSession.id,
                        },
                    },
                    update: {
                        status: 'SWAPPED',
                        assignedById: actorUserId,
                    },
                    create: {
                        id: uuidv4(),
                        proctorId: application.teacherId,
                        examSessionId: targetSession.id,
                        status: 'SWAPPED',
                        assignedById: actorUserId,
                    },
                });
            }
        });
    }

    private async getHallClusterSessions(
        hallInvigilatorId: string,
        examOpenTime: Date | null,
        examCloseTime: Date | null,
    ): Promise<Array<{ id: string }>> {
        if (!examOpenTime || !examCloseTime) {
            return [];
        }

        return this.prisma.examSession.findMany({
            where: {
                hallInvigilatorId,
                examOpenTime,
                examCloseTime,
            },
            select: { id: true },
        });
    }

    private async ensureProctorAvailability(
        proctorId: string,
        assigneeLabel: string,
        examOpenTime: Date | null,
        examCloseTime: Date | null,
        excludedSessionIds: string[],
    ): Promise<void> {
        if (!examOpenTime || !examCloseTime) {
            throw new ConflictException('The selected session is missing its exam time');
        }

        const conflict = await this.prisma.examSession.findFirst({
            where: {
                id: { notIn: excludedSessionIds },
                proctorId,
                examOpenTime: { lt: examCloseTime },
                examCloseTime: { gt: examOpenTime },
            },
            select: {
                examOpenTime: true,
                examCloseTime: true,
                examRoom: {
                    select: {
                        roomNumber: true,
                    },
                },
            },
        });

        if (conflict) {
            throw new ConflictException(this.buildOverlapConflictMessage(assigneeLabel, conflict.examRoom?.roomNumber ?? null, conflict.examOpenTime, conflict.examCloseTime));
        }
    }

    private async ensureHallInvigilatorAvailability(
        hallInvigilatorId: string,
        assigneeLabel: string,
        examOpenTime: Date | null,
        examCloseTime: Date | null,
        excludedSessionIds: string[],
    ): Promise<void> {
        if (!examOpenTime || !examCloseTime) {
            throw new ConflictException('The selected session is missing its exam time');
        }

        const conflict = await this.prisma.examSession.findFirst({
            where: {
                id: { notIn: excludedSessionIds },
                hallInvigilatorId,
                examOpenTime: { lt: examCloseTime },
                examCloseTime: { gt: examOpenTime },
            },
            select: {
                examOpenTime: true,
                examCloseTime: true,
                examRoom: {
                    select: {
                        roomNumber: true,
                    },
                },
            },
        });

        if (conflict) {
            throw new ConflictException(this.buildOverlapConflictMessage(assigneeLabel, conflict.examRoom?.roomNumber ?? null, conflict.examOpenTime, conflict.examCloseTime));
        }
    }

    private buildOverlapConflictMessage(
        assigneeLabel: string,
        roomNumber: string | null,
        examOpenTime: Date | null,
        examCloseTime: Date | null,
    ): string {
        const roomLabel = roomNumber ? `phòng ${roomNumber}` : 'một ca thi khác';
        const timeLabel = this.formatSessionTimeRange(examOpenTime, examCloseTime);

        return `${assigneeLabel} sẽ bị trùng với ca ${roomLabel}${timeLabel ? ` (${timeLabel})` : ''} sau khi đổi lịch.`;
    }

    private formatSessionTimeRange(examOpenTime: Date | null, examCloseTime: Date | null): string {
        if (!examOpenTime) {
            return '';
        }

        const formatDate = (value: Date) =>
            `${String(value.getDate()).padStart(2, '0')}/${String(value.getMonth() + 1).padStart(2, '0')}/${value.getFullYear()}`;
        const formatTime = (value: Date) =>
            `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;

        return `${formatDate(examOpenTime)} ${formatTime(examOpenTime)} - ${examCloseTime ? formatTime(examCloseTime) : '--:--'}`;
    }
}
