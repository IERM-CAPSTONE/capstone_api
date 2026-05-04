import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { ExamSession } from '../domain/entities';
import { IExamSessionRepository, SubjectMonitorSummary, SessionRoomDetail } from '../domain/repositories';

@Injectable()
export class PrismaExamSessionRepository implements IExamSessionRepository {
    private readonly logger = new Logger(PrismaExamSessionRepository.name);

    constructor(private readonly prisma: PrismaService) { }

    async getMonitorSummary(query: {
        campus?: string;
        semesterId?: string;
        date?: Date;
    }): Promise<SubjectMonitorSummary[]> {
        const targetDate = query.date || new Date();
        const startOfDay = new Date(targetDate);
        startOfDay.setDate(startOfDay.getDate() - 1);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setDate(endOfDay.getDate() + 1);
        endOfDay.setHours(23, 59, 59, 999);

        const where: any = {
            campus: query.campus as any,
            semesterId: query.semesterId,
            examOpenTime: {
                gte: startOfDay,
                lte: endOfDay,
            },
        };

        // Fetch all relevant sessions with their counts and related data
        const sessions = await this.prisma.examSession.findMany({
            where,
            include: {
                examRoom: true,
                proctor: true,
                hallInvigilator: true,
                _count: {
                    select: {
                        studentExams: true,
                        tickets: true,
                    }
                },
                examSeats: {
                    where: {
                        status: 'Present'
                    },
                    select: {
                        id: true
                    }
                }
            }
        });

        // Group by subjectCode and time to avoid clashing slots on the same day
        const groups = new Map<string, SubjectMonitorSummary>();

        for (const s of sessions) {
            const subjectCode = s.subjectCode || 'Unknown';
            const timeKey = s.examOpenTime ? s.examOpenTime.toISOString() : 'no-time';
            const groupKey = `${subjectCode}_${timeKey}`;

            let summary = groups.get(groupKey);

            const sessionDetail: SessionRoomDetail = {
                sessionId: s.id,
                roomNumber: s.examRoom?.roomNumber || 'N/A',
                proctorName: s.proctor?.fullName || null,
                proctorOnline: !!s.proctorCheckedInAt,
                hallInvigilatorName: s.hallInvigilator?.fullName || null,
                hallInvigilatorOnline: false,
                checkedIn: s.examSeats.length,
                totalStudents: s._count.studentExams,
                pendingTickets: s._count.tickets,
            };

            if (!summary) {
                summary = {
                    subjectCode,
                    examOpenTime: s.examOpenTime || startOfDay,
                    examCloseTime: s.examCloseTime || endOfDay,
                    status: s.status as any,
                    totalProctors: 0,
                    presentProctors: 0,
                    totalHallInvigilators: 0,
                    presentHallInvigilators: 0,
                    totalStudents: 0,
                    checkedInStudents: 0,
                    pendingTickets: 0,
                    sessions: [],
                };
                groups.set(groupKey, summary);
            }

            summary.totalProctors += s.proctorId ? 1 : 0;
            summary.presentProctors += s.proctorCheckedInAt ? 1 : 0;
            summary.totalHallInvigilators += s.hallInvigilatorId ? 1 : 0;
            summary.presentHallInvigilators += s.hallInvigilatorId ? 1 : 0;
            summary.totalStudents += sessionDetail.totalStudents;
            summary.checkedInStudents += sessionDetail.checkedIn;
            summary.pendingTickets += sessionDetail.pendingTickets;
            summary.sessions.push(sessionDetail);

            // Prioritize statuses: Ongoing > Scheduled > Draft > Completed
            const statusPriority: Record<string, number> = {
                'Ongoing': 100,
                'Scheduled': 80,
                'Draft': 60,
                'Completed': 40
            };

            if (statusPriority[s.status] > (statusPriority[summary.status] || 0)) {
                summary.status = s.status as any;
            }
        }

        return Array.from(groups.values());
    }

    async save(session: ExamSession): Promise<ExamSession> {
        const data = {
            subjectCode: session.subjectCode?.value,
            examOpenTime: session.examTime.openTime,
            examCloseTime: session.examTime.closeTime,
            examCode: session.examCode,
            openCode: session.openCode,
            status: session.status as any,
            proctorCheckedInAt: session.proctorCheckedInAt,
            campus: session.campus as any,
            examType: session.examType as any,
            note: session.note,
            hasStudentsImported: false, // Default or map from entity if exist
            updatedAt: session.updatedAt,
        };

        const relationData: any = {};
        if (session.examRoomId) relationData.examRoom = { connect: { id: session.examRoomId } };
        if (session.proctorId) relationData.proctor = { connect: { id: session.proctorId } };
        if (session.hallInvigilatorId) relationData.hallInvigilator = { connect: { id: session.hallInvigilatorId } };
        if (session.semesterId) relationData.semester = { connect: { id: session.semesterId } };

        const updateRelationData: any = {};
        updateRelationData.examRoom = session.examRoomId ? { connect: { id: session.examRoomId } } : { disconnect: true };
        updateRelationData.proctor = session.proctorId ? { connect: { id: session.proctorId } } : { disconnect: true };
        updateRelationData.hallInvigilator = session.hallInvigilatorId ? { connect: { id: session.hallInvigilatorId } } : { disconnect: true };
        updateRelationData.semester = session.semesterId ? { connect: { id: session.semesterId } } : { disconnect: true };

        const saved = await this.prisma.examSession.upsert({
            where: { id: session.id },
            create: {
                id: session.id,
                ...data,
                ...relationData,
                createdAt: session.createdAt,
                examParts: {
                    connect: session.examPart.map(code => ({ code }))
                }
            },
            update: {
                ...data,
                ...updateRelationData,
                examParts: {
                    set: session.examPart.map(code => ({ code }))
                }
            },
            include: {
                examRoom: true,
                proctor: true,
                hallInvigilator: true,
                semester: true,
                examParts: true,
                proctorApplications: {
                    include: {
                        teacher: {
                            select: {
                                id: true,
                                fullName: true,
                                username: true,
                            },
                        },
                    },
                },
                _count: {
                    select: { studentExams: true }
                }
            }
        });

        return ExamSession.mapFromPrisma(saved);
    }

    async findById(id: string): Promise<ExamSession | null> {
        const includeFull = {
            examRoom: true,
            proctor: true,
            hallInvigilator: true,
            semester: true,
            examParts: true,
            proctorApplications: {
                include: {
                    teacher: {
                        select: {
                            id: true,
                            fullName: true,
                            username: true,
                        },
                    },
                },
            },
            _count: {
                select: { studentExams: true }
            }
        } as const;

        const includeSafe = {
            examRoom: true,
            proctor: true,
            hallInvigilator: true,
            semester: true,
            examParts: true,
            _count: {
                select: { studentExams: true }
            }
        } as const;

        let found: any;
        try {
            found = await this.prisma.examSession.findUnique({
                where: { id },
                include: includeFull,
            });
        } catch (error: any) {
            const errorMessage = String(error?.message || '');
            const shouldFallback = error?.code === 'P2007' || errorMessage.includes('invalid input syntax for type integer');
            if (!shouldFallback) throw error;

            this.logger.warn(`findById fallback for session ${id}: ${errorMessage}`);
            found = await this.prisma.examSession.findUnique({
                where: { id },
                include: includeSafe,
            });
        }
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
        campus?: string;
        examType?: string;
        studentId?: string;
        skip?: number;
        take?: number;
    }): Promise<ExamSession[]> {
        const where = this.buildWhere(query);

        const skipVal = isNaN(query?.skip) || query?.skip < 0 ? 0 : Math.floor(query.skip);
        const takeVal = isNaN(query?.take) || query?.take <= 0 ? undefined : Math.floor(query.take);

        const includeFull = {
            examRoom: true,
            proctor: true,
            hallInvigilator: true,
            semester: true,
            examParts: true,
            proctorApplications: {
                include: {
                    teacher: {
                        select: {
                            id: true,
                            fullName: true,
                            username: true,
                        },
                    },
                },
            },
            _count: {
                select: { studentExams: true }
            }
        } as const;

        const includeSafe = {
            examRoom: true,
            proctor: true,
            hallInvigilator: true,
            semester: true,
            examParts: true,
            _count: {
                select: { studentExams: true }
            }
        } as const;

        let found: any[];
        try {
            found = await this.prisma.examSession.findMany({
                where,
                skip: skipVal,
                take: takeVal,
                orderBy: { createdAt: 'desc' },
                include: includeFull,
            });
        } catch (error: any) {
            const errorMessage = String(error?.message || '');
            const shouldFallback = error?.code === 'P2007' || errorMessage.includes('invalid input syntax for type integer');
            if (!shouldFallback) throw error;

            this.logger.warn(`findMany fallback activated: ${errorMessage}`);
            found = await this.prisma.examSession.findMany({
                where,
                skip: skipVal,
                take: takeVal,
                orderBy: { createdAt: 'desc' },
                include: includeSafe,
            });
        }

        return found.map(item => ExamSession.mapFromPrisma(item));
    }

    private buildWhere(query?: any): any {
        const where: any = {};
        const andConditions: any[] = [];

        // Sanitize string fields - ensure they don't get passed as objects
        if (query?.subjectCode && typeof query.subjectCode === 'string') {
            where.subjectCode = query.subjectCode;
        }

        if (query?.examCode && typeof query.examCode === 'string') {
            where.OR = [
                { examCode: { contains: query.examCode, mode: 'insensitive' } },
                { subjectCode: { contains: query.examCode, mode: 'insensitive' } }
            ];
        }

        // Handle status - can be a string or an object like { not: 'Draft' }
        if (query?.status) {
            if (typeof query.status === 'string') {
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
            } else if (typeof query.status === 'object' && query.status !== null) {
                // Handle Prisma filter objects like { not: 'Draft' }
                where.status = query.status;
            }
        }

        

        // Date range filtering
        if (query?.fromDate || query?.toDate || query?.date) {
            const dateConditions: any = {};

            if (query.date && typeof query.date === 'string') {
                const date = new Date(query.date);
                dateConditions.gte = new Date(date.setHours(0, 0, 0, 0));
                dateConditions.lte = new Date(date.setHours(23, 59, 59, 999));
            } else {
                if (query.fromDate && typeof query.fromDate === 'string') {
                    const from = new Date(query.fromDate);
                    dateConditions.gte = new Date(from.setHours(0, 0, 0, 0));
                }
                if (query.toDate && typeof query.toDate === 'string') {
                    const to = new Date(query.toDate);
                    dateConditions.lte = new Date(to.setHours(23, 59, 59, 999));
                }
            }

            if (Object.keys(dateConditions).length > 0) {
                andConditions.push({ examOpenTime: dateConditions });
            }
        }

        // Time filtering (simplified for now as it's hard to filter time-only in Prisma)
        if (query?.startTime && query.fromDate && typeof query.startTime === 'string' && typeof query.fromDate === 'string') {
            const [h, m] = query.startTime.split(':').map(Number);
            const start = new Date(query.fromDate);
            start.setHours(h, m, 0, 0);
            andConditions.push({ examOpenTime: { gte: start } });
        }
        if (query?.endTime && (query.toDate || query.fromDate) && typeof query.endTime === 'string') {
            const [h, m] = query.endTime.split(':').map(Number);
            const end = new Date((query.toDate || query.fromDate) as string);
            end.setHours(h, m, 59, 999);
            andConditions.push({ examCloseTime: { lte: end } });
        }

        // ID fields - ensure they're strings, not objects
        if (query?.examRoomId && typeof query.examRoomId === 'string') where.examRoomId = query.examRoomId;
        if (query?.proctorId && typeof query.proctorId === 'string') where.proctorId = query.proctorId;
        if (query?.hallInvigilatorId && typeof query.hallInvigilatorId === 'string') where.hallInvigilatorId = query.hallInvigilatorId;
        if (query?.semesterId && typeof query.semesterId === 'string') where.semesterId = query.semesterId;
        if (query?.campus && typeof query.campus === 'string') where.campus = query.campus;
        if (query?.examType && typeof query.examType === 'string') where.examType = query.examType;

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
                semester: true,
                examParts: true,
                proctorApplications: {
                    include: {
                        teacher: {
                            select: {
                                id: true,
                                fullName: true,
                                username: true,
                            },
                        },
                    },
                },
                _count: {
                    select: { studentExams: true }
                }
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
        hallInvigilatorId?: string;
        studentId?: string;
    }): Promise<number> {
        const where = this.buildWhere(query);
        return this.prisma.examSession.count({ where });
    }

    async updateStatusBulk(ids: string[], status: string): Promise<number> {
        const result = await this.prisma.examSession.updateMany({
            where: { id: { in: ids } },
            data: { status: status as any }
        });
        return result.count;
    }

    async publishGeneratedDrafts(semesterId: string, campus: string): Promise<number> {
        const result = await this.prisma.examSession.updateMany({
            where: {
                semesterId,
                campus: campus as any,
                status: 'Draft'
            },
            data: { status: 'Scheduled' }
        });
        return result.count;
    }

    async publishAllDraftsForSemester(semesterId: string): Promise<number> {
        const result = await this.prisma.examSession.updateMany({
            where: {
                semesterId,
                status: 'Draft'
            },
            data: { status: 'Scheduled' }
        });
        return result.count;
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
            include: {
                examRoom: true,
                proctor: true,
                hallInvigilator: true,
                semester: true,
            },
        });

        return overlapping.map(item => ExamSession.mapFromPrisma(item));
    }
}
