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
        const swapContext = await this.validateSwapRequest({
            requesterId: teacherId,
            sourceExamSessionId: dto.examSessionId,
            targetExamSessionId: dto.targetExamSessionId,
        });

        const preferredDate = swapContext.source.examOpenTime;
        const preferredShift = swapContext.source.examOpenTime && swapContext.source.examOpenTime.getHours() < 12
            ? 'MORNING'
            : 'AFTERNOON';

        const application = ProctorApplication.create({
            id: uuidv4(),
            teacherId,
            targetTeacherId: swapContext.target.proctorId,
            examSessionId: swapContext.source.id,
            targetExamSessionId: swapContext.target.id,
            preferredShift: dto.preferredType === 'ROOM' ? preferredShift : dto.preferredShift,
            preferredType: 'ROOM',
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

    private async validateSwapRequest(params: {
        requesterId: string;
        sourceExamSessionId: string;
        targetExamSessionId: string;
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

        if (!source.proctorId || source.proctorId !== params.requesterId) {
            throw new BadRequestException('You can only create a swap request from your own assigned session');
        }

        if (!target.proctorId) {
            throw new BadRequestException('The target session does not have a proctor to swap with');
        }

        if (target.proctorId === params.requesterId) {
            throw new BadRequestException('You cannot create a swap request with another session already assigned to you');
        }

        if (!this.isSameExamDay(source.examOpenTime, target.examOpenTime)) {
            throw new BadRequestException('Swap requests are only allowed between sessions on the same exam day');
        }

        const existingPending = await this.prisma.proctorApplication.findFirst({
            where: {
                id: params.excludeId ? { not: params.excludeId } : undefined,
                status: 'PENDING' as any,
                OR: [
                    {
                        teacherId: params.requesterId,
                        examSessionId: source.id,
                        targetExamSessionId: target.id,
                    },
                    {
                        teacherId: target.proctorId,
                        targetTeacherId: params.requesterId,
                        examSessionId: target.id,
                        targetExamSessionId: source.id,
                    },
                ],
            },
        });

        if (existingPending) {
            throw new ConflictException('A pending swap request already exists between these two proctors for this exam day');
        }

        return { source, target };
    }
}
