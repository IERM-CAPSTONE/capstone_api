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
            examType: session.examType as any,
            semester: session.semester,
            note: session.note,
            updatedAt: session.updatedAt,
        };

        const createRelationData: any = {};
        if (session.examRoomId) createRelationData.examRoom = { connect: { id: session.examRoomId } };
        if (session.proctorId) createRelationData.proctor = { connect: { id: session.proctorId } };
        if (session.hallInvigilatorId) createRelationData.hallInvigilator = { connect: { id: session.hallInvigilatorId } };

        const updateRelationData = {
            examRoom: session.examRoomId ? { connect: { id: session.examRoomId } } : { disconnect: true },
            proctor: session.proctorId ? { connect: { id: session.proctorId } } : { disconnect: true },
            hallInvigilator: session.hallInvigilatorId ? { connect: { id: session.hallInvigilatorId } } : { disconnect: true },
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
            }
        });

        return ExamSession.reconstitute({
            id: saved.id,
            subjectCode: saved.subjectCode,
            examRoomId: saved.examRoomId,
            proctorId: saved.proctorId,
            hallInvigilatorId: saved.hallInvigilatorId,
            examOpenTime: saved.examOpenTime,
            examCloseTime: saved.examCloseTime,
            examCode: saved.examCode,
            openCode: saved.openCode,
            status: saved.status,
            examType: saved.examType as string[],
            semester: saved.semester,
            note: saved.note,
            createdAt: saved.createdAt,
            updatedAt: saved.updatedAt,
            roomNumber: saved.examRoom?.roomNumber,
            maxRows: saved.examRoom?.max_rows,
            maxColumns: saved.examRoom?.max_columns,
            totalSeats: saved.examRoom?.total_seats,
        });
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

        return ExamSession.reconstitute({
            id: found.id,
            subjectCode: found.subjectCode,
            examRoomId: found.examRoomId,
            proctorId: found.proctorId,
            hallInvigilatorId: found.hallInvigilatorId,
            examOpenTime: found.examOpenTime,
            examCloseTime: found.examCloseTime,
            examCode: found.examCode,
            openCode: found.openCode,
            status: found.status,
            examType: found.examType as string[],
            semester: found.semester,
            note: found.note,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
            roomNumber: found.examRoom?.roomNumber,
            proctorName: found.proctor?.fullName,
            hallInvigilatorName: found.hallInvigilator?.fullName,
            maxRows: found.examRoom?.max_rows,
            maxColumns: found.examRoom?.max_columns,
            totalSeats: found.examRoom?.total_seats,
        });
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
        skip?: number;
        take?: number;
    }): Promise<ExamSession[]> {
        const where = this.buildWhere(query);

        const found = await this.prisma.examSession.findMany({
            where,
            skip: query?.skip,
            take: query?.take,
            orderBy: { createdAt: 'desc' },
            include: {
                examRoom: true,
                proctor: true,
                hallInvigilator: true,
            }
        });

        return found.map(item => ExamSession.reconstitute({
            id: item.id,
            subjectCode: item.subjectCode,
            examRoomId: item.examRoomId,
            proctorId: item.proctorId,
            hallInvigilatorId: item.hallInvigilatorId,
            examOpenTime: item.examOpenTime,
            examCloseTime: item.examCloseTime,
            examCode: item.examCode,
            openCode: item.openCode,
            status: item.status,
            examType: item.examType as string[],
            semester: item.semester,
            note: item.note,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            roomNumber: item.examRoom?.roomNumber,
            proctorName: item.proctor?.fullName,
            hallInvigilatorName: item.hallInvigilator?.fullName,
            maxRows: item.examRoom?.max_rows,
            maxColumns: item.examRoom?.max_columns,
            totalSeats: item.examRoom?.total_seats,
            isArchived: item.isArchived ?? false,
        }));
    }

    private buildWhere(query?: any): any {
        const where: any = {};

        // Exclude archived sessions by default
        where.isArchived = false;

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
                where.examOpenTime = { gt: now };
            } else if (query.status === 'Ongoing') {
                where.AND = [
                    { examOpenTime: { lte: now } },
                    { examCloseTime: { gte: now } }
                ];
            } else if (query.status === 'Completed') {
                where.examCloseTime = { lt: now };
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

            where.examOpenTime = { ...where.examOpenTime, ...dateConditions };
        }

        // Time filtering (simplified for now as it's hard to filter time-only in Prisma)
        // If fromDate == toDate (single day), we can combine with time
        if (query?.startTime || query?.endTime) {
            // This logic is simplified to "occurs after startTime" and "occurs before endTime" 
            // naturally relative to the date filter already applied.
            if (query.startTime && query.fromDate) {
                const [h, m] = query.startTime.split(':').map(Number);
                const start = new Date(query.fromDate);
                start.setHours(h, m, 0, 0);
                where.examOpenTime = { ...where.examOpenTime, gte: start };
            }
            if (query.endTime && (query.toDate || query.fromDate)) {
                const [h, m] = query.endTime.split(':').map(Number);
                const end = new Date(query.toDate || query.fromDate);
                end.setHours(h, m, 59, 999);
                where.examCloseTime = { ...where.examCloseTime, lte: end };
            }
        }

        if (query?.examRoomId) where.examRoomId = query.examRoomId;
        if (query?.proctorId) where.proctorId = query.proctorId;

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
            examCode: found.examCode,
            openCode: found.openCode,
            status: found.status,
            examType: found.examType as string[],
            semester: found.semester,
            note: found.note,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
            roomNumber: null,
            proctorName: null,
            hallInvigilatorName: null,
            maxRows: null,
            maxColumns: null,
            totalSeats: null,
            isArchived: found.isArchived ?? false,
        });
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
        });

        return overlapping.map(item => ExamSession.reconstitute({
            id: item.id,
            subjectCode: item.subjectCode,
            examRoomId: item.examRoomId,
            proctorId: item.proctorId,
            hallInvigilatorId: item.hallInvigilatorId,
            examOpenTime: item.examOpenTime,
            examCloseTime: item.examCloseTime,
            examCode: item.examCode,
            openCode: item.openCode,
            status: item.status,
            examType: item.examType as string[],
            semester: item.semester,
            note: item.note,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            isArchived: item.isArchived ?? false,
        }));
    }
}
