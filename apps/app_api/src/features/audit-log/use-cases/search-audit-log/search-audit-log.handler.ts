import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { Prisma } from '@prisma/client';
import { SearchAuditLogDto } from './search-audit-log.dto';

@Injectable()
export class SearchAuditLogHandler {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: SearchAuditLogDto) {
    const keyword = query.keyword.trim();

    if (!keyword) {
      return {
        tickets: [],
        attendanceSnapshots: [],
      };
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          {
            code: {
              equals: keyword,
              mode: 'insensitive',
            },
          },
          {
            email: {
              equals: keyword,
              mode: 'insensitive',
            },
          },
        ],
      },
      select: {
        id: true,
        code: true,
      },
    });

    if (!user) {
      return {
        tickets: [],
        attendanceSnapshots: [],
      };
    }

    const ticketOrConditions: Prisma.IssueTicketWhereInput[] = [];

    if (user.code) {
      ticketOrConditions.push({
        studentCode: {
          equals: user.code,
          mode: 'insensitive',
        },
      });
    }

    ticketOrConditions.push({ reporterId: user.id });

    const [tickets, attendanceSnapshots] = await Promise.all([
      this.prisma.issueTicket.findMany({
        where: {
          OR: ticketOrConditions,
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          issueName: true,
          issueType: true,
          description: true,
          studentCode: true,
          status: true,
          priority: true,
          sessionId: true,
          attachment: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.attendanceSnapshot.findMany({
        where: {
          OR: [
            { matchedUserId: user.id },
            { capturedUserId: user.id },
          ],
        },
        orderBy: { captureTimestamp: 'desc' },
        select: {
          id: true,
          actorType: true,
          examSessionId: true,
          examPartCode: true,
          capturedUserId: true,
          matchedUserId: true,
          status: true,
          confidence: true,
          imageUrl: true,
          captureTimestamp: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      tickets,
      attendanceSnapshots,
    };
  }
}
