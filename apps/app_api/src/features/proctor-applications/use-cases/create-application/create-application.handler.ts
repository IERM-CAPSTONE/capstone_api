import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ProctorApplication, IProctorApplicationRepository, PROCTOR_APPLICATION_REPOSITORY } from '@app/proctor-applications';
import { PrismaService } from '@app/prisma';
import { ProctorApplicationResponse, toProctorApplicationResponse } from '../../shared/proctor-application.response';
import { CreateProctorApplicationDto } from './create-application.dto';
import { NotificationGateway } from '../../../../common/gateways/notification.gateway';

@Injectable()
export class CreateProctorApplicationHandler {
    constructor(
        @Inject(PROCTOR_APPLICATION_REPOSITORY)
        private readonly repository: IProctorApplicationRepository,
        private readonly prisma: PrismaService,
        private readonly notificationGateway: NotificationGateway,
    ) { }

    async execute(dto: CreateProctorApplicationDto, teacherId: string): Promise<ProctorApplicationResponse> {
        const preferredType = await this.resolvePreferredType(teacherId);
        const swapContext = await this.validateSwapRequest({
            requesterId: teacherId,
            sourceExamSessionId: dto.examSessionId,
            targetExamSessionId: dto.targetExamSessionId,
            preferredType,
        });

        const preferredDate = swapContext.source.examOpenTime;
        const preferredShift = swapContext.source.examOpenTime && swapContext.source.examOpenTime.getHours() < 12
            ? 'MORNING'
            : 'AFTERNOON';

        const application = ProctorApplication.create({
            id: uuidv4(),
            teacherId,
            targetTeacherId: swapContext.targetAssigneeId,
            examSessionId: swapContext.source.id,
            targetExamSessionId: swapContext.target.id,
            preferredShift,
            preferredType,
            preferredDate,
            notes: dto.notes ?? null,
            status: 'PENDING',
        });

        const savedApplication = await this.repository.save(application);

        try {
            const payload = toProctorApplicationResponse(savedApplication);
            if (savedApplication.targetTeacherId) {
                this.notificationGateway.sendToUser(savedApplication.targetTeacherId, 'proctor:swap-request:created', payload);
            }
            this.notificationGateway.sendToAll('proctor:application:created', payload);
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('Failed to emit proctor swap request notification', err);
        }

        return toProctorApplicationResponse(savedApplication);
    }

    private isSameExamDay(left: Date | null, right: Date | null): boolean {
        if (!left || !right) return false;

        return left.getFullYear() === right.getFullYear()
            && left.getMonth() === right.getMonth()
            && left.getDate() === right.getDate();
    }

    private async resolvePreferredType(userId: string): Promise<'ROOM' | 'HALL'> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        return user.role === 'HALL_INVIGILATOR' ? 'HALL' : 'ROOM';
    }

    private async validateSwapRequest(params: {
        requesterId: string;
        sourceExamSessionId: string;
        targetExamSessionId: string;
        preferredType: 'ROOM' | 'HALL';
        excludeId?: string;
    }) {
        if (params.sourceExamSessionId === params.targetExamSessionId) {
            throw new BadRequestException('Source session and target session must be different');
        }

        const [source, target] = await Promise.all([
            this.prisma.examSession.findUnique({
                where: { id: params.sourceExamSessionId },
                select: {
                    id: true,
                    proctorId: true,
                    hallInvigilatorId: true,
                    examOpenTime: true,
                    examCloseTime: true,
                    status: true,
                },
            }),
            this.prisma.examSession.findUnique({
                where: { id: params.targetExamSessionId },
                select: {
                    id: true,
                    proctorId: true,
                    hallInvigilatorId: true,
                    examOpenTime: true,
                    examCloseTime: true,
                    status: true,
                },
            }),
        ]);

        if (!source || !target) {
            throw new NotFoundException('One or both exam sessions were not found');
        }

        if (source.status === 'Draft' || target.status === 'Draft') {
            throw new BadRequestException('Swap requests can only be created for published exam sessions');
        }

        const sourceAssigneeId = params.preferredType === 'HALL' ? source.hallInvigilatorId : source.proctorId;
        const targetAssigneeId = params.preferredType === 'HALL' ? target.hallInvigilatorId : target.proctorId;
        const assignmentLabel = params.preferredType === 'HALL' ? 'hall invigilator' : 'proctor';

        if (!sourceAssigneeId || sourceAssigneeId !== params.requesterId) {
            throw new BadRequestException('You can only create a swap request from your own assigned session');
        }

        if (!targetAssigneeId) {
            throw new BadRequestException(`The target session does not have an assigned ${assignmentLabel} to swap with`);
        }

        if (targetAssigneeId === params.requesterId) {
            throw new BadRequestException('You cannot create a swap request with another session already assigned to you');
        }

        if (!this.isSameExamDay(source.examOpenTime, target.examOpenTime)) {
            throw new BadRequestException('Swap requests are only allowed between sessions on the same exam day');
        }

        const [sourceClusterSessionIds, targetClusterSessionIds] = params.preferredType === 'HALL'
            ? await Promise.all([
                this.getHallClusterSessionIds(sourceAssigneeId, source.examOpenTime, source.examCloseTime),
                this.getHallClusterSessionIds(targetAssigneeId, target.examOpenTime, target.examCloseTime),
            ])
            : [[source.id], [target.id]];

        const existingPending = await this.prisma.proctorApplication.findFirst({
            where: {
                id: params.excludeId ? { not: params.excludeId } : undefined,
                status: 'PENDING' as any,
                preferredType: params.preferredType as any,
                OR: [
                    {
                        teacherId: params.requesterId,
                        examSessionId: { in: sourceClusterSessionIds },
                        targetExamSessionId: { in: targetClusterSessionIds },
                    },
                    {
                        teacherId: targetAssigneeId,
                        targetTeacherId: params.requesterId,
                        examSessionId: { in: targetClusterSessionIds },
                        targetExamSessionId: { in: sourceClusterSessionIds },
                    },
                ],
            },
        });

        if (existingPending) {
            throw new ConflictException('A pending swap request already exists between these two assignees for this exam day');
        }

        return { source, target, targetAssigneeId };
    }

    private async getHallClusterSessionIds(
        hallInvigilatorId: string,
        examOpenTime: Date | null,
        examCloseTime: Date | null,
    ): Promise<string[]> {
        if (!examOpenTime || !examCloseTime) {
            return [];
        }

        const sessions = await this.prisma.examSession.findMany({
            where: {
                hallInvigilatorId,
                examOpenTime,
                examCloseTime,
            },
            select: { id: true },
        });

        return sessions.map((session) => session.id);
    }
}
