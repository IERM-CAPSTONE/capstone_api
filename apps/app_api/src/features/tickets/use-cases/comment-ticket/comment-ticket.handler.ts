import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@app/prisma';
import { TICKET_REPOSITORY, ITicketRepository } from '@app/tickets';
import { CommentTicketDto } from './comment-ticket.dto';

@Injectable()
export class CommentTicketHandler {
    constructor(
        @Inject(TICKET_REPOSITORY)
        private readonly ticketRepository: ITicketRepository,
        private readonly prisma: PrismaService,
    ) { }

    async execute(ticketId: string, dto: CommentTicketDto, actorId: string): Promise<any> {
        const ticket = await this.ticketRepository.findById(ticketId);
        if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);

        const content = (dto.content ?? '').trim();
        if (!content) {
            throw new BadRequestException('content is required');
        }

        const actor = await this.prisma.user.findUnique({
            where: { id: actorId },
            select: { fullName: true },
        });

        const useForAiTraining = dto.useForAiTraining === true;
        if (useForAiTraining) {
            if (!dto.finalIssueName || !dto.finalIssueType || !dto.resolutionCode) {
                throw new BadRequestException(
                    'finalIssueName, finalIssueType, and resolutionCode are required when useForAiTraining is true',
                );
            }
            if (dto.finalIssueName === 'OTHER' && !(dto.finalIssueCustomText ?? '').trim()) {
                throw new BadRequestException(
                    'finalIssueCustomText is required when finalIssueName is "OTHER"',
                );
            }
            if (dto.resolutionCode === 'CUSTOM' && !(dto.resolutionCustomText ?? '').trim()) {
                throw new BadRequestException(
                    'resolutionCustomText is required when resolutionCode is "CUSTOM"',
                );
            }

            const requiresAiReview =
                dto.finalIssueName === 'OTHER' || dto.resolutionCode === 'CUSTOM';

            await this.ticketRepository.save({
                id: ticketId,
                finalIssueName: dto.finalIssueName,
                finalIssueType: dto.finalIssueType,
                finalIssueCustomText:
                    dto.finalIssueName === 'OTHER'
                        ? (dto.finalIssueCustomText ?? '').trim() || null
                        : null,
                resolutionCode: dto.resolutionCode,
                resolutionCustomText:
                    dto.resolutionCode === 'CUSTOM'
                        ? (dto.resolutionCustomText ?? '').trim() || null
                        : null,
                resolutionStandardText:
                    dto.resolutionCode === 'CUSTOM'
                        ? null
                        : (dto.resolutionStandardText ?? '').trim() || null,
                needsAiReview: requiresAiReview,
                aiTrainingStatus: requiresAiReview ? 'PENDING_REVIEW' : 'APPROVED',
                reviewedBy: requiresAiReview ? null : actorId,
                reviewedAt: requiresAiReview ? null : new Date(),
                reviewNote: requiresAiReview
                    ? 'Pending AI review from structured comment because custom taxonomy was used.'
                    : 'Approved automatically from structured comment taxonomy.',
            });
        }

        await this.prisma.activityHistory.create({
            data: {
                id: uuidv4(),
                ticketId,
                studentExamId: null,
                activityType: 'TICKET_COMMENTED' as any,
                description: JSON.stringify({
                    event: 'TICKET_COMMENTED',
                    title: 'Ticket Comment',
                    message: `${actor?.fullName ?? 'Staff'} added a comment`,
                    meta: {
                        ticketId,
                        actorId,
                        comment: content,
                        useForAiTraining,
                        finalIssueName: dto.finalIssueName ?? null,
                        finalIssueType: dto.finalIssueType ?? null,
                        finalIssueCustomText: dto.finalIssueCustomText ?? null,
                        resolutionCode: dto.resolutionCode ?? null,
                        resolutionCustomText: dto.resolutionCustomText ?? null,
                        resolutionStandardText: dto.resolutionStandardText ?? null,
                        aiTrainingStatus: useForAiTraining
                            ? dto.finalIssueName === 'OTHER' || dto.resolutionCode === 'CUSTOM'
                                ? 'PENDING_REVIEW'
                                : 'APPROVED'
                            : null,
                    },
                }),
                actorId,
                note: content,
            } as any,
        });

        return this.ticketRepository.findById(ticketId);
    }
}
