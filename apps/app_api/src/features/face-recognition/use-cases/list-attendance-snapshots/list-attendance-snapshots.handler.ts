import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { Prisma } from '@prisma/client';
import { ListAttendanceSnapshotsDto } from './list-attendance-snapshots.dto';

@Injectable()
export class ListAttendanceSnapshotsHandler {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListAttendanceSnapshotsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.AttendanceSnapshotWhereInput = {
      ...(query.examSessionId && { examSessionId: query.examSessionId }),
      ...(query.status && { status: query.status }),
      ...(query.actorType && { actorType: query.actorType }),
      ...(query.matchedUserId && { matchedUserId: query.matchedUserId }),
      ...((query.fromDate || query.toDate) && {
        captureTimestamp: {
          ...(query.fromDate && { gte: new Date(query.fromDate) }),
          ...(query.toDate && { lte: new Date(query.toDate) }),
        },
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.attendanceSnapshot.findMany({
        where,
        orderBy: { captureTimestamp: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.attendanceSnapshot.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }
}
