import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IProctorApplicationRepository, PROCTOR_APPLICATION_REPOSITORY } from '@app/proctor-applications';
import { PrismaService } from '@app/prisma';
import { ProctorApplicationResponse, toProctorApplicationResponse } from '../../shared/proctor-application.response';
import { UpdateProctorApplicationDto } from './update-application.dto';

@Injectable()
export class UpdateProctorApplicationHandler {
    constructor(
        @Inject(PROCTOR_APPLICATION_REPOSITORY)
        private readonly repository: IProctorApplicationRepository,
        private readonly prisma: PrismaService,
    ) { }

    async execute(id: string, dto: UpdateProctorApplicationDto, teacherId: string): Promise<ProctorApplicationResponse> {
        const application = await this.repository.findById(id);
        if (!application) {
            throw new NotFoundException('Application not found');
        }

        if (application.teacherId !== teacherId) {
            throw new ForbiddenException('You can only update your own applications');
        }

        if (application.status !== 'PENDING') {
            throw new BadRequestException('Only pending swap requests can be updated');
        }

        const nextSourceSessionId = dto.examSessionId !== undefined ? dto.examSessionId : application.examSessionId;
        const nextTargetSessionId = dto.targetExamSessionId !== undefined ? dto.targetExamSessionId : application.targetExamSessionId;

        if (!nextSourceSessionId || !nextTargetSessionId) {
            throw new BadRequestException('Both source session and target session are required');
        }

        const swapContext = await this.validateSwapRequest({
            requesterId: teacherId,
            sourceExamSessionId: nextSourceSessionId,
            targetExamSessionId: nextTargetSessionId,
            excludeId: application.id,
        });

        const preferredDate = swapContext.source.examOpenTime;
        const preferredShift = preferredDate && preferredDate.getHours() < 12 ? 'MORNING' : 'AFTERNOON';

        const updatedApplication = application.update({
            targetTeacherId: swapContext.target.proctorId,
            examSessionId: swapContext.source.id,
            targetExamSessionId: swapContext.target.id,
            preferredShift,
            preferredType: 'ROOM',
            preferredDate,
            notes: dto.notes !== undefined ? dto.notes : undefined,
        });

        const saved = await this.repository.save(updatedApplication);

        return toProctorApplicationResponse(saved);
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
