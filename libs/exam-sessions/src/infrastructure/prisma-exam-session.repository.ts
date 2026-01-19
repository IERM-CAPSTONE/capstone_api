import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { ExamSession } from '../domain/entities';
import { IExamSessionRepository } from '../domain/repositories';

@Injectable()
export class PrismaExamSessionRepository implements IExamSessionRepository {
    constructor(private readonly prisma: PrismaService) { }

    async save(session: ExamSession): Promise<ExamSession> {
        const data = {
            subjectCode: session.subjectCode?.value,
            examOpenTime: session.examTime.openTime,
            examCloseTime: session.examTime.closeTime,
            status: session.status as any,
            examType: session.examType as any,
            updatedAt: session.updatedAt,
        };

        const relationData = {
            examRoom: session.examRoomId ? { connect: { id: session.examRoomId } } : { disconnect: true },
            proctor: session.proctorId ? { connect: { id: session.proctorId } } : { disconnect: true },
            hallInvigilator: session.hallInvigilatorId ? { connect: { id: session.hallInvigilatorId } } : { disconnect: true },
        };

        const saved = await this.prisma.examSession.upsert({
            where: { id: session.id },
            create: {
                id: session.id,
                ...data,
                ...relationData,
                createdAt: session.createdAt,
            },
            update: {
                ...data,
                ...relationData,
            },
        });

        return ExamSession.reconstitute({
            id: saved.id,
            subjectCode: saved.subjectCode,
            examRoomId: saved.examRoomId,
            proctorId: saved.proctorId,
            hallInvigilatorId: saved.hallInvigilatorId,
            examOpenTime: saved.examOpenTime,
            examCloseTime: saved.examCloseTime,
            status: saved.status,
            examType: saved.examType as string[],
            createdAt: saved.createdAt,
            updatedAt: saved.updatedAt,
        });
    }

    async findById(id: string): Promise<ExamSession | null> {
        const found = await this.prisma.examSession.findUnique({
            where: { id },
            select: {
                id: true,
                subjectCode: true,
                examRoomId: true,
                proctorId: true,
                hallInvigilatorId: true,
                examOpenTime: true,
                examCloseTime: true,
                status: true,
                examType: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!found) return null;

        return ExamSession.reconstitute({
            id: found.id,
            subjectCode: found.subjectCode,
            examRoomId: found.examRoomId,
            proctorId: found.proctorId,
            hallInvigilatorId: found.hallInvigilatorId,
            examOpenTime: found.examOpenTime,
            examCloseTime: found.examCloseTime,
            status: found.status,
            examType: found.examType as string[],
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
        });
    }

    async findMany(query?: {
        subjectCode?: string;
        examRoomId?: string;
        proctorId?: string;
        skip?: number;
        take?: number;
    }): Promise<ExamSession[]> {
        const where: any = {};
        if (query?.subjectCode) where.subjectCode = query.subjectCode;
        if (query?.examRoomId) where.examRoomId = query.examRoomId;
        if (query?.proctorId) where.proctorId = query.proctorId;

        const found = await this.prisma.examSession.findMany({
            where,
            skip: query?.skip,
            take: query?.take,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                subjectCode: true,
                examRoomId: true,
                proctorId: true,
                hallInvigilatorId: true,
                examOpenTime: true,
                examCloseTime: true,
                status: true,
                examType: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return found.map(item => ExamSession.reconstitute({
            id: item.id,
            subjectCode: item.subjectCode,
            examRoomId: item.examRoomId,
            proctorId: item.proctorId,
            hallInvigilatorId: item.hallInvigilatorId,
            examOpenTime: item.examOpenTime,
            examCloseTime: item.examCloseTime,
            status: item.status,
            examType: item.examType as string[],
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        }));
    }

    async findOne(query: {
        id?: string;
        examRoomId?: string;
        proctorId?: string;
    }): Promise<ExamSession | null> {
        const where: any = {};
        if (query.id) where.id = query.id;
        if (query.examRoomId) where.examRoomId = query.examRoomId;
        if (query.proctorId) where.proctorId = query.proctorId;

        const found = await this.prisma.examSession.findFirst({
            where,
            select: {
                id: true,
                subjectCode: true,
                examRoomId: true,
                proctorId: true,
                hallInvigilatorId: true,
                examOpenTime: true,
                examCloseTime: true,
                status: true,
                examType: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!found) return null;

        return ExamSession.reconstitute({
            id: found.id,
            subjectCode: found.subjectCode,
            examRoomId: found.examRoomId,
            proctorId: found.proctorId,
            hallInvigilatorId: found.hallInvigilatorId,
            examOpenTime: found.examOpenTime,
            examCloseTime: found.examCloseTime,
            status: found.status,
            examType: found.examType as string[],
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
        });
    }

    async exists(id: string): Promise<boolean> {
        const count = await this.prisma.examSession.count({ where: { id } });
        return count > 0;
    }

    async count(query?: {
        examRoomId?: string;
        proctorId?: string;
    }): Promise<number> {
        const where: any = {};
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
                AND: [
                    { examOpenTime: { lt: endTime } },
                    { examCloseTime: { gt: startTime } },
                ],
                OR: orConditions,
            },
            select: {
                id: true,
                subjectCode: true,
                examRoomId: true,
                proctorId: true,
                hallInvigilatorId: true,
                examOpenTime: true,
                examCloseTime: true,
                status: true,
                examType: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return overlapping.map(item => ExamSession.reconstitute({
            id: item.id,
            subjectCode: item.subjectCode,
            examRoomId: item.examRoomId,
            proctorId: item.proctorId,
            hallInvigilatorId: item.hallInvigilatorId,
            examOpenTime: item.examOpenTime,
            examCloseTime: item.examCloseTime,
            status: item.status,
            examType: item.examType as string[],
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
        }));
    }
}
