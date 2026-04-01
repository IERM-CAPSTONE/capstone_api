import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { TICKET_REPOSITORY, ITicketRepository } from '../domain';

@Injectable()
export class PrismaTicketRepository implements ITicketRepository {
    constructor(private readonly prisma: PrismaService) { }

    async save(data: any): Promise<any> {
        if (data.id) {
            // Update existing
            return this.prisma.issueTicket.update({
                where: { id: data.id },
                data: {
                    status: data.status,
                    assigneeId: data.assigneeId,
                    resolveNote: data.resolveNote,
                    techNote: data.techNote,
                    priority: data.priority,
                    description: data.description,
                    attachment: data.attachment,
                } as any,
                include: {
                    reporter: true,
                    assignee: true,
                    session: true,
                },
            });
        }

        // Create new
        return this.prisma.issueTicket.create({
            data: {
                issueName: data.issueName,
                issueType: data.issueType,
                description: data.description,
                priority: data.priority ?? 'Medium',
                status: data.status ?? 'OPEN',
                reporterId: data.reporterId,
                sessionId: data.sessionId ?? null,
                attachment: data.attachment ?? null,
                studentCode: data.studentCode ?? null,
            } as any,
            include: {
                reporter: true,
                assignee: true,
                session: { include: { examRoom: true } },
            },
        });
    }

    async findById(id: string): Promise<any | null> {
        return this.prisma.issueTicket.findUnique({
            where: { id },
            include: {
                reporter: { select: { id: true, fullName: true, email: true, role: true } },
                assignee: { select: { id: true, fullName: true, email: true, role: true } },
                session: { include: { examRoom: { select: { id: true, roomNumber: true } } } },
                activityHistories: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
    }

    async findMany(filters: {
        status?: string;
        reporterId?: string;
        assigneeId?: string;
        issueType?: string;
        sessionId?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<any[]> {
        const where: any = {};

        if (filters.status) where.status = filters.status;
        if (filters.reporterId) where.reporterId = filters.reporterId;
        if (filters.assigneeId) where.assigneeId = filters.assigneeId;
        if (filters.issueType) where.issueType = filters.issueType;
        if (filters.sessionId) where.sessionId = filters.sessionId;

        if (filters.fromDate || filters.toDate) {
            where.createdAt = {};
            if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate);
            if (filters.toDate) {
                const to = new Date(filters.toDate);
                to.setHours(23, 59, 59, 999);
                where.createdAt.lte = to;
            }
        }

        return this.prisma.issueTicket.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                reporter: { select: { id: true, fullName: true, email: true, role: true } },
                assignee: { select: { id: true, fullName: true, email: true, role: true } },
                session: {
                    include: {
                        examRoom: { select: { id: true, roomNumber: true } },
                    },
                },
            },
        });
    }
}
