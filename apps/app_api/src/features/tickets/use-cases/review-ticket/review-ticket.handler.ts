import { Injectable, Inject, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@app/prisma';
import { TICKET_REPOSITORY, ITicketRepository } from '@app/tickets';
import { ReviewTicketDto, AiTrainingStatusEnum } from './review-ticket.dto';

@Injectable()
export class ReviewTicketHandler {
    constructor(
        @Inject(TICKET_REPOSITORY)
        private readonly ticketRepository: ITicketRepository,
        private readonly prisma: PrismaService,
    ) { }

    async execute(ticketId: string, dto: ReviewTicketDto, reviewerId: string): Promise<any> {
        const ticket = await this.ticketRepository.findById(ticketId);
        if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);
        if (ticket.status !== 'SOLVED') {
            throw new BadRequestException('Only solved tickets can be reviewed for AI training');
        }
        if (ticket.needsAiReview !== true) {
            throw new BadRequestException('This ticket is not pending AI review');
        }

        const reviewer = await this.prisma.user.findUnique({
            where: { id: reviewerId },
            select: { fullName: true, role: true },
        });
        if (!reviewer) throw new NotFoundException(`Reviewer ${reviewerId} not found`);
        if (!['EXAM_OFFICER', 'ADMIN'].includes(reviewer.role)) {
            throw new ForbiddenException('Only exam officers or admins can review AI-training tickets');
        }

        if (dto.aiTrainingStatus === AiTrainingStatusEnum.APPROVED) {
            if (!dto.finalIssueName || !dto.finalIssueType || !dto.resolutionCode) {
                throw new BadRequestException('Approved reviews require finalIssueName, finalIssueType, and resolutionCode');
            }
            if (dto.finalIssueName === 'OTHER' || dto.resolutionCode === 'CUSTOM') {
                throw new BadRequestException('Approved reviews must map the ticket back to standardized taxonomy');
            }
        }

        const updatedTicket = await this.ticketRepository.save({
            id: ticketId,
            finalIssueName:
                dto.aiTrainingStatus === AiTrainingStatusEnum.APPROVED
                    ? dto.finalIssueName
                    : ticket.finalIssueName,
            finalIssueType:
                dto.aiTrainingStatus === AiTrainingStatusEnum.APPROVED
                    ? dto.finalIssueType
                    : ticket.finalIssueType,
            resolutionCode:
                dto.aiTrainingStatus === AiTrainingStatusEnum.APPROVED
                    ? dto.resolutionCode
                    : ticket.resolutionCode,
            resolutionStandardText:
                dto.aiTrainingStatus === AiTrainingStatusEnum.APPROVED
                    ? dto.resolutionStandardText ?? ticket.resolutionStandardText ?? null
                    : ticket.resolutionStandardText,
            needsAiReview: false,
            aiTrainingStatus: dto.aiTrainingStatus,
            reviewedBy: reviewerId,
            reviewedAt: new Date(),
            reviewNote: (dto.reviewNote ?? '').trim() || null,
        });

        await this.prisma.activityHistory.create({
            data: {
                id: uuidv4(),
                ticketId,
                studentExamId: null,
                activityType: 'TICKET_COMMENTED' as any,
                description: JSON.stringify({
                    event: 'TICKET_AI_REVIEWED',
                    title: 'AI Review',
                    message: `${reviewer.fullName ?? 'Reviewer'} marked this ticket as ${dto.aiTrainingStatus}`,
                    meta: {
                        ticketId,
                        aiTrainingStatus: dto.aiTrainingStatus,
                        finalIssueName: dto.finalIssueName ?? null,
                        resolutionCode: dto.resolutionCode ?? null,
                    },
                }),
                actorId: reviewerId,
                note: (dto.reviewNote ?? '').trim() || null,
            } as any,
        });

        return updatedTicket;
    }
}
