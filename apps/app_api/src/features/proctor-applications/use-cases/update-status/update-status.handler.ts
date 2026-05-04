import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IProctorApplicationRepository, PROCTOR_APPLICATION_REPOSITORY } from '@app/proctor-applications';
import { PrismaService } from '@app/prisma';
import { v4 as uuidv4 } from 'uuid';
import { ProctorApplicationResponse, toProctorApplicationResponse } from '../../shared/proctor-application.response';
import { UpdateProctorApplicationStatusDto } from './update-status.dto';

@Injectable()
export class UpdateProctorApplicationStatusHandler {
    constructor(
        @Inject(PROCTOR_APPLICATION_REPOSITORY)
        private readonly repository: IProctorApplicationRepository,
        private readonly prisma: PrismaService,
    ) { }

    async execute(id: string, dto: UpdateProctorApplicationStatusDto, actorUserId: string): Promise<ProctorApplicationResponse> {
        const application = await this.repository.findById(id);
        if (!application) {
            throw new NotFoundException('Application not found');
        }

        if (application.targetTeacherId !== actorUserId) {
            throw new ForbiddenException('Only the target proctor can respond to this swap request');
        }

        if (application.status !== 'PENDING') {
            throw new BadRequestException('This swap request has already been processed');
        }

        if (dto.status === 'APPROVED') {
            await this.applySwap(application, actorUserId);
        }

        const updatedApplication = application.updateStatus(dto.status);
        const saved = await this.repository.save(updatedApplication);

        return toProctorApplicationResponse(saved);
    }

    private isSameExamDay(left: Date | null, right: Date | null): boolean {
        if (!left || !right) return false;

        return left.getFullYear() === right.getFullYear()
            && left.getMonth() === right.getMonth()
            && left.getDate() === right.getDate();
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
                    examOpenTime: true,
                    examCloseTime: true,
                },
            }),
            this.prisma.examSession.findUnique({
                where: { id: application.targetExamSessionId },
                select: {
                    id: true,
                    proctorId: true,
                    examOpenTime: true,
                    examCloseTime: true,
                },
            }),
        ]);

        if (!sourceSession || !targetSession) {
            throw new NotFoundException('One or both exam sessions were not found');
        }

        if (sourceSession.proctorId !== application.teacherId) {
            throw new ConflictException('The requester is no longer assigned to the source session');
        }

        if (targetSession.proctorId !== actorUserId) {
            throw new ConflictException('You are no longer assigned to the target session');
        }

        if (!this.isSameExamDay(sourceSession.examOpenTime, targetSession.examOpenTime)) {
            throw new ConflictException('These sessions are no longer on the same exam day');
        }

        await this.prisma.$transaction(async (tx) => {
            await tx.examSession.update({
                where: { id: sourceSession.id },
                data: { proctorId: actorUserId },
            });

            await tx.examSession.update({
                where: { id: targetSession.id },
                data: { proctorId: application.teacherId },
            });

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
        });
    }
}
