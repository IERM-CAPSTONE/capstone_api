import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { PaginatedAttendanceLogResponse, toAttendanceLogResponse } from '../../shared';
import { ListAllLogsDto } from './list-all-logs.dto';

@Injectable()
export class ListAllLogsHandler {
    constructor(private readonly prisma: PrismaService) { }

    async execute(dto: ListAllLogsDto): Promise<PaginatedAttendanceLogResponse> {
        const page = parseInt(String(dto.page || 1), 10);
        const limit = parseInt(String(dto.limit || 10), 10);
        const skip = (page - 1) * limit;

        const where: any = {};

        if (dto.studentId) where.studentId = dto.studentId;
        if (dto.studentCode) {
            where.studentCode = {
                contains: dto.studentCode,
                mode: 'insensitive',
            };
        }
        if (dto.examSessionId) where.examSessionId = dto.examSessionId;
        if (dto.deviceId) where.deviceId = dto.deviceId;
        if (dto.status) where.status = dto.status;
        if (dto.isCorrectRoom !== undefined) where.isCorrectRoom = dto.isCorrectRoom;
        if (dto.fromTime || dto.toTime) {
            where.timestamp = {
                ...(dto.fromTime ? { gte: new Date(dto.fromTime) } : {}),
                ...(dto.toTime ? { lte: new Date(dto.toTime) } : {}),
            };
        }

        const [logs, total] = await Promise.all([
            this.prisma.attendanceLog.findMany({
                where,
                skip,
                take: limit,
                orderBy: { timestamp: 'desc' },
            }),
            this.prisma.attendanceLog.count({ where }),
        ]);

        return {
            data: logs.map(toAttendanceLogResponse),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
