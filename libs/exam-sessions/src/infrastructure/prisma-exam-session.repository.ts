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
            examCode: session.examCode,
            openCode: session.openCode,
            status: session.status as any,
            note: session.note,
            updatedAt: session.updatedAt,
        };

        // Pre-lookup valid ExamType records to avoid "not found" errors on connect
        let validExamTypeIds: { id: string }[] = [];
        if (session.examType?.length) {
            const found = await this.prisma.examType.findMany({
                where: { code: { in: session.examType } },
                select: { id: true },
            });
            validExamTypeIds = found;
        }

        const createRelationData: any = {};
        if (session.examRoomId) createRelationData.examRoom = { connect: { id: session.examRoomId } };
        if (session.proctorId) createRelationData.proctor = { connect: { id: session.proctorId } };
        if (session.hallInvigilatorId) createRelationData.hallInvigilator = { connect: { id: session.hallInvigilatorId } };
        if (session.semesterId) createRelationData.semester = { connect: { id: session.semesterId } };
        if (validExamTypeIds.length > 0) {
            createRelationData.examType = { connect: validExamTypeIds };
        }

        const updateRelationData = {
            examRoom: session.examRoomId ? { connect: { id: session.examRoomId } } : { disconnect: true },
            proctor: session.proctorId ? { connect: { id: session.proctorId } } : { disconnect: true },
            hallInvigilator: session.hallInvigilatorId ? { connect: { id: session.hallInvigilatorId } } : { disconnect: true },
            semester: session.semesterId ? { connect: { id: session.semesterId } } : { disconnect: true },
            examType: { set: validExamTypeIds },
        };

        const saved = await this.prisma.examSession.upsert({
            where: { id: session.id },
            create: {
                id: session.id,
                ...data,
                ...createRelationData,
                createdAt: session.createdAt,
            },
            update: {
                ...data,
                ...updateRelationData,
            },
            include: {
                examRoom: true,
                proctor: true,
                hallInvigilator: true,
            }
        });

        return ExamSession.mapFromPrisma(saved);
    }

    async findById(id: string): Promise<ExamSession | null> {
        const found = await this.prisma.examSession.findUnique({
            where: { id },
            include: {
                examRoom: true,
                proctor: true,
                hallInvigilator: true,
            }
        });
        if (!found) return null;

        return ExamSession.mapFromPrisma(found);
    }

    async findMany(query?: {
        subjectCode?: string;
        examCode?: string;
        date?: string;
        time?: string;
        status?: string;
        fromDate?: string;
        toDate?: string;
        startTime?: string;
        endTime?: string;
        examRoomId?: string;
        proctorId?: string;
        semesterId?: string;
        studentId?: string;
        skip?: number;
        take?: number;
    }): Promise<ExamSession[]> {
        const where = this.buildWhere(query);

        const skipVal = isNaN(query?.skip) || query?.skip < 0 ? 0 : Math.floor(query.skip);
        const takeVal = isNaN(query?.take) || query?.take <= 0 ? undefined : Math.floor(query.take);

        const found = await this.prisma.examSession.findMany({
            where,
            skip: skipVal,
            take: takeVal,
            orderBy: { createdAt: 'desc' },
            include: {
                examRoom: true,
                proctor: true,
                hallInvigilator: true,
            }
        });

        return found.map(item => ExamSession.mapFromPrisma(item));
    }

    private buildWhere(query?: any): any {
        const where: any = {};
        const andConditions: any[] = [];

        if (query?.subjectCode) {
            where.subjectCode = query.subjectCode;
        }

        if (query?.examCode) {
            where.OR = [
                { examCode: { contains: query.examCode, mode: 'insensitive' } },
                { subjectCode: { contains: query.examCode, mode: 'insensitive' } }
            ];
        }

        if (query?.status) {
            const now = new Date();
            if (query.status === 'Upcoming') {
                andConditions.push({ examOpenTime: { gt: now } });
            } else if (query.status === 'Ongoing') {
                andConditions.push({ examOpenTime: { lte: now } });
                andConditions.push({ examCloseTime: { gte: now } });
            } else if (query.status === 'Completed') {
                andConditions.push({ examCloseTime: { lt: now } });
            } else {
                where.status = query.status;
            }
        }

        // Date range filtering
        if (query?.fromDate || query?.toDate || query?.date) {
            const dateConditions: any = {};

            if (query.date) {
                const date = new Date(query.date);
                dateConditions.gte = new Date(date.setHours(0, 0, 0, 0));
                dateConditions.lte = new Date(date.setHours(23, 59, 59, 999));
            } else {
                if (query.fromDate) {
                    const from = new Date(query.fromDate);
                    dateConditions.gte = new Date(from.setHours(0, 0, 0, 0));
                }
                if (query.toDate) {
                    const to = new Date(query.toDate);
                    dateConditions.lte = new Date(to.setHours(23, 59, 59, 999));
                }
            }

            andConditions.push({ examOpenTime: dateConditions });
        }

        // Time filtering (simplified for now as it's hard to filter time-only in Prisma)
        if (query?.startTime && query.fromDate) {
            const [h, m] = query.startTime.split(':').map(Number);
            const start = new Date(query.fromDate);
            start.setHours(h, m, 0, 0);
            andConditions.push({ examOpenTime: { gte: start } });
        }
        if (query?.endTime && (query.toDate || query.fromDate)) {
            const [h, m] = query.endTime.split(':').map(Number);
            const end = new Date(query.toDate || query.fromDate);
            end.setHours(h, m, 59, 999);
            andConditions.push({ examCloseTime: { lte: end } });
        }

        if (query?.examRoomId) where.examRoomId = query.examRoomId;
        if (query?.proctorId) where.proctorId = query.proctorId;
        if (query?.semesterId) where.semesterId = query.semesterId;

        if (query?.studentId) {
            where.studentExams = {
                some: {
                    studentId: query.studentId
                }
            };
        }

        // If we have AND conditions, we need to combine them
        // If we also have direct properties, we need to wrap them all in AND
        if (andConditions.length > 0) {
            if (Object.keys(where).length > 0) {
                // We have both direct properties and AND conditions
                // Convert direct properties to AND conditions
                Object.keys(where).forEach(key => {
                    andConditions.push({ [key]: where[key] });
                });
                return { AND: andConditions };
            } else {
                // Only AND conditions
                if (andConditions.length === 1) {
                    return andConditions[0];
                } else {
                    return { AND: andConditions };
                }
            }
        }

        return where;
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
            include: {
                examRoom: true,
                proctor: true,
                hallInvigilator: true,
            },
        });

        if (!found) return null;

        return ExamSession.mapFromPrisma(found);
    }

    async exists(id: string): Promise<boolean> {
        const count = await this.prisma.examSession.count({ where: { id } });
        return count > 0;
    }

    async count(query?: {
        subjectCode?: string;
        examCode?: string;
        date?: string;
        time?: string;
        status?: string;
        fromDate?: string;
        toDate?: string;
        startTime?: string;
        endTime?: string;
        examRoomId?: string;
        proctorId?: string;
        studentId?: string;
    }): Promise<number> {
        const where = this.buildWhere(query);
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
                    { isArchived: false },
                ],
                OR: orConditions,
            },
            include: {
                examRoom: true,
                proctor: true,
                hallInvigilator: true,
            },
        });

        return overlapping.map(item => ExamSession.mapFromPrisma(item));
    }
}
