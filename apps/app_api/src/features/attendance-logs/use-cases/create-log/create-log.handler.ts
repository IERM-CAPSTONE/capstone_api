import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { AttendanceLogResponse, toAttendanceLogResponse } from '../../shared';
import { CreateAttendanceLogDto } from './create-log.dto';

@Injectable()
export class CreateAttendanceLogHandler {
    constructor(private readonly prisma: PrismaService) { }

    async execute(dto: CreateAttendanceLogDto): Promise<AttendanceLogResponse> {
        const log = await this.prisma.attendanceLog.create({
            data: {
                uid: dto.uid ?? null,
                studentId: dto.studentId || null,
                studentCode: dto.studentCode || null,
                studentName: dto.studentName || null,
                examSessionId: dto.examSessionId || null,
                status: dto.status,
                confidence: dto.confidence ?? null,
                isCorrectRoom: dto.isCorrectRoom ?? null,
                message: dto.message || null,
                deviceId: dto.deviceId || null,
            },
        });

        return toAttendanceLogResponse(log);
    }
}
