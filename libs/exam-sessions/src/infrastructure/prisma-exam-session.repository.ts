import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { ExamSession } from '../domain/entities';
import { IExamSessionRepository } from '../domain/repositories';

@Injectable()
export class PrismaExamSessionRepository implements IExamSessionRepository {
    constructor(private readonly prisma: PrismaService) { }

    async save(session: ExamSession): Promise<ExamSession> {
        const data = {
            examRoomId: session.examRoomId,
            proctorId: session.proctorId,
            hallInvigilatorId: session.hallInvigilatorId,
            semesterCode: session.semesterCode?.value ?? null,
            examOpenTime: session.examTime.openTime,
            examCloseTime: session.examTime.closeTime,
            updatedAt: session.updatedAt,
        };

        const saved = await this.prisma.examSession.upsert({
            where: { id: session.id },
            create: {
                id: session.id,
                ...data,
                createdAt: session.createdAt,
            },
            update: data,
        });

        return ExamSession.reconstitute({
            id: saved.id,
            examRoomId: saved.examRoomId,
            proctorId: saved.proctorId,
            hallInvigilatorId: saved.hallInvigilatorId,
            semesterCode: saved.semesterCode,
            examOpenTime: saved.examOpenTime,
            examCloseTime: saved.examCloseTime,
            createdAt: saved.createdAt,
            updatedAt: saved.updatedAt,
        });
    }

    async findById(id: string): Promise<ExamSession | null> {
        const found = await this.prisma.examSession.findUnique({
            where: { id },
        });
        if (!found) return null;

        return ExamSession.reconstitute({
            id: found.id,
            examRoomId: found.examRoomId,
            proctorId: found.proctorId,
            hallInvigilatorId: found.hallInvigilatorId,
            semesterCode: found.semesterCode,
            examOpenTime: found.examOpenTime,
            examCloseTime: found.examCloseTime,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
        });
    }

    async findMany(query?: {
        semesterCode?: string;
        examRoomId?: string;
        proctorId?: string;
        skip?: number;
        take?: number;
    }): Promise<ExamSession[]> {
        const where: any = {};
        if (query?.semesterCode) where.semesterCode = query.semesterCode;
        if (query?.examRoomId) where.examRoomId = query.examRoomId;
        if (query?.proctorId) where.proctorId = query.proctorId;

        const found = await this.prisma.examSession.findMany({
            where,
            skip: query?.skip,
            take: query?.take,
            orderBy: { createdAt: 'desc' },
        });

        return found.map(item => ExamSession.reconstitute({
            id: item.id,
            examRoomId: item.examRoomId,
            proctorId: item.proctorId,
            hallInvigilatorId: item.hallInvigilatorId,
            semesterCode: item.semesterCode,
            examOpenTime: item.examOpenTime,
            examCloseTime: item.examCloseTime,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        }));
    }

    async exists(id: string): Promise<boolean> {
        const count = await this.prisma.examSession.count({ where: { id } });
        return count > 0;
    }

    async count(query?: {
        semesterCode?: string;
        examRoomId?: string;
        proctorId?: string;
    }): Promise<number> {
        const where: any = {};
        if (query?.semesterCode) where.semesterCode = query.semesterCode;
        if (query?.examRoomId) where.examRoomId = query.examRoomId;
        if (query?.proctorId) where.proctorId = query.proctorId;

        return this.prisma.examSession.count({ where });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.examSession.delete({ where: { id } });
    }

    async findOverlapping(params: {
        startTime: Date;
        endTime: Date;
        examRoomId?: string | null;
        proctorId?: string | null;
        hallInvigilatorId?: string | null;
        excludeId?: string;
    }): Promise<ExamSession[]> {
        const { startTime, endTime, examRoomId, proctorId, hallInvigilatorId, excludeId } = params;

        const orConditions: any[] = [];

        if (examRoomId) orConditions.push({ examRoomId });
        if (proctorId) orConditions.push({ proctorId });
        if (hallInvigilatorId) orConditions.push({ hallInvigilatorId });

        if (orConditions.length === 0) return [];

        const overlapping = await this.prisma.examSession.findMany({
            where: {
                id: excludeId ? { not: excludeId } : undefined,
                // Time overlap logic: (Start1 < End2) AND (End1 > Start2)
                AND: [
                    { examOpenTime: { lt: endTime } },
                    { examCloseTime: { gt: startTime } },
                ],
                OR: orConditions,
            },
        });

        return overlapping.map(item => ExamSession.reconstitute({
            id: item.id,
            examRoomId: item.examRoomId,
            proctorId: item.proctorId,
            hallInvigilatorId: item.hallInvigilatorId,
            semesterCode: item.semesterCode,
            examOpenTime: item.examOpenTime,
            examCloseTime: item.examCloseTime,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        }));
    }
}
