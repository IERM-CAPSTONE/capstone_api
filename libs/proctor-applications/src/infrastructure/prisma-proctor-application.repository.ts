import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { ProctorApplication } from '../domain/entities';
import { IProctorApplicationRepository } from '../domain/repositories';

@Injectable()
export class PrismaProctorApplicationRepository implements IProctorApplicationRepository {
    constructor(private readonly prisma: PrismaService) { }

    async save(application: ProctorApplication): Promise<ProctorApplication> {
        const data = {
            teacherId: application.teacherId,
            targetTeacherId: application.targetTeacherId,
            examSessionId: application.examSessionId,
            targetExamSessionId: application.targetExamSessionId,
            preferredShift: application.preferredShift as any,
            preferredType: application.preferredType as any,
            preferredDate: application.preferredDate,
            notes: application.notes,
            status: application.status as any,
            updatedAt: application.updatedAt,
        };

        const saved = await this.prisma.proctorApplication.upsert({
            where: { id: application.id },
            create: {
                id: application.id,
                ...data,
                createdAt: application.createdAt,
            },
            update: data,
            include: {
                teacher: {
                    select: {
                        id: true,
                        fullName: true,
                        code: true,
                    },
                },
                targetTeacher: {
                    select: {
                        id: true,
                        fullName: true,
                        code: true,
                    },
                },
                examSession: {
                    select: {
                        examOpenTime: true,
                        examCloseTime: true,
                        examRoom: {
                            select: {
                                roomNumber: true,
                            },
                        },
                    },
                },
                targetExamSession: {
                    select: {
                        examOpenTime: true,
                        examCloseTime: true,
                        examRoom: {
                            select: {
                                roomNumber: true,
                            },
                        },
                    },
                },
            },
        });

        return ProctorApplication.reconstitute({
            id: saved.id,
            teacherId: saved.teacherId,
            targetTeacherId: saved.targetTeacherId,
            examSessionId: saved.examSessionId,
            targetExamSessionId: saved.targetExamSessionId,
            preferredShift: saved.preferredShift,
            preferredType: saved.preferredType,
            preferredDate: saved.preferredDate,
            notes: saved.notes,
            status: saved.status,
            createdAt: saved.createdAt,
            updatedAt: saved.updatedAt,
            teacherName: saved.teacher?.fullName,
            teacherCode: saved.teacher?.code,
            targetTeacherName: saved.targetTeacher?.fullName ?? null,
            targetTeacherCode: saved.targetTeacher?.code ?? null,
            roomNumber: saved.examSession?.examRoom?.roomNumber ?? null,
            examOpenTime: saved.examSession?.examOpenTime ?? null,
            examCloseTime: saved.examSession?.examCloseTime ?? null,
            targetRoomNumber: saved.targetExamSession?.examRoom?.roomNumber ?? null,
            targetExamOpenTime: saved.targetExamSession?.examOpenTime ?? null,
            targetExamCloseTime: saved.targetExamSession?.examCloseTime ?? null,
        });
    }

    async findById(id: string): Promise<ProctorApplication | null> {
        const found = await this.prisma.proctorApplication.findUnique({
            where: { id },
            include: {
                teacher: {
                    select: {
                        id: true,
                        fullName: true,
                        code: true,
                    },
                },
                targetTeacher: {
                    select: {
                        id: true,
                        fullName: true,
                        code: true,
                    },
                },
                examSession: {
                    select: {
                        examOpenTime: true,
                        examCloseTime: true,
                        examRoom: {
                            select: {
                                roomNumber: true,
                            },
                        },
                    },
                },
                targetExamSession: {
                    select: {
                        examOpenTime: true,
                        examCloseTime: true,
                        examRoom: {
                            select: {
                                roomNumber: true,
                            },
                        },
                    },
                },
            },
        });

        if (!found) return null;

        return ProctorApplication.reconstitute({
            id: found.id,
            teacherId: found.teacherId,
            targetTeacherId: found.targetTeacherId,
            examSessionId: found.examSessionId,
            targetExamSessionId: found.targetExamSessionId,
            preferredShift: found.preferredShift,
            preferredType: found.preferredType,
            preferredDate: found.preferredDate,
            notes: found.notes,
            status: found.status,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
            teacherName: found.teacher?.fullName,
            teacherCode: found.teacher?.code,
            targetTeacherName: found.targetTeacher?.fullName ?? null,
            targetTeacherCode: found.targetTeacher?.code ?? null,
            roomNumber: found.examSession?.examRoom?.roomNumber ?? null,
            examOpenTime: found.examSession?.examOpenTime ?? null,
            examCloseTime: found.examSession?.examCloseTime ?? null,
            targetRoomNumber: found.targetExamSession?.examRoom?.roomNumber ?? null,
            targetExamOpenTime: found.targetExamSession?.examOpenTime ?? null,
            targetExamCloseTime: found.targetExamSession?.examCloseTime ?? null,
        });
    }

    async findByTeacherId(teacherId: string): Promise<ProctorApplication[]> {
        const results = await this.prisma.proctorApplication.findMany({
            where: {
                OR: [
                    { teacherId },
                    { targetTeacherId: teacherId },
                ],
            },
            include: {
                teacher: {
                    select: {
                        id: true,
                        fullName: true,
                        code: true,
                    },
                },
                targetTeacher: {
                    select: {
                        id: true,
                        fullName: true,
                        code: true,
                    },
                },
                examSession: {
                    select: {
                        examOpenTime: true,
                        examCloseTime: true,
                        examRoom: {
                            select: {
                                roomNumber: true,
                            },
                        },
                    },
                },
                targetExamSession: {
                    select: {
                        examOpenTime: true,
                        examCloseTime: true,
                        examRoom: {
                            select: {
                                roomNumber: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return results.map(item => ProctorApplication.reconstitute({
            id: item.id,
            teacherId: item.teacherId,
            targetTeacherId: item.targetTeacherId,
            examSessionId: item.examSessionId,
            targetExamSessionId: item.targetExamSessionId,
            preferredShift: item.preferredShift,
            preferredType: item.preferredType,
            preferredDate: item.preferredDate,
            notes: item.notes,
            status: item.status,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            teacherName: item.teacher?.fullName,
            teacherCode: item.teacher?.code,
            targetTeacherName: item.targetTeacher?.fullName ?? null,
            targetTeacherCode: item.targetTeacher?.code ?? null,
            roomNumber: item.examSession?.examRoom?.roomNumber ?? null,
            examOpenTime: item.examSession?.examOpenTime ?? null,
            examCloseTime: item.examSession?.examCloseTime ?? null,
            targetRoomNumber: item.targetExamSession?.examRoom?.roomNumber ?? null,
            targetExamOpenTime: item.targetExamSession?.examOpenTime ?? null,
            targetExamCloseTime: item.targetExamSession?.examCloseTime ?? null,
        }));
    }

    async findMany(criteria?: {
        teacherId?: string;
        status?: string;
        semesterCode?: string;
        preferredDateStart?: Date;
        preferredDateEnd?: Date;
        page?: number;
        limit?: number;
    }): Promise<{ data: ProctorApplication[]; total: number }> {
        const page = criteria?.page ?? 1;
        const limit = criteria?.limit ?? 10;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (criteria?.teacherId) {
            where.teacherId = criteria.teacherId;
        }

        if (criteria?.status) {
            where.status = criteria.status;
        }

        if (criteria?.preferredDateStart || criteria?.preferredDateEnd) {
            where.preferredDate = {};
            if (criteria.preferredDateStart) {
                where.preferredDate.gte = criteria.preferredDateStart;
            }
            if (criteria.preferredDateEnd) {
                where.preferredDate.lte = criteria.preferredDateEnd;
            }
        }

        const skipVal = isNaN(skip) || skip < 0 ? 0 : Math.floor(skip);
        const limitVal = isNaN(limit) || limit <= 0 ? 10 : Math.floor(limit);

        const [results, total] = await Promise.all([
            this.prisma.proctorApplication.findMany({
                where,
                include: {
                    teacher: {
                        select: {
                            id: true,
                            fullName: true,
                            code: true,
                        },
                    },
                    targetTeacher: {
                        select: {
                            id: true,
                            fullName: true,
                            code: true,
                        },
                    },
                    examSession: {
                        select: {
                            examOpenTime: true,
                            examCloseTime: true,
                            examRoom: {
                                select: {
                                    roomNumber: true,
                                },
                            },
                        },
                    },
                    targetExamSession: {
                        select: {
                            examOpenTime: true,
                            examCloseTime: true,
                            examRoom: {
                                select: {
                                    roomNumber: true,
                                },
                            },
                        },
                    },
                },
                skip: skipVal,
                take: limitVal,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.proctorApplication.count({ where }),
        ]);

        const data = results.map(item => ProctorApplication.reconstitute({
            id: item.id,
            teacherId: item.teacherId,
            targetTeacherId: item.targetTeacherId,
            examSessionId: item.examSessionId,
            targetExamSessionId: item.targetExamSessionId,
            preferredShift: item.preferredShift,
            preferredType: item.preferredType,
            preferredDate: item.preferredDate,
            notes: item.notes,
            status: item.status,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            teacherName: item.teacher?.fullName,
            teacherCode: item.teacher?.code,
            targetTeacherName: item.targetTeacher?.fullName ?? null,
            targetTeacherCode: item.targetTeacher?.code ?? null,
            roomNumber: item.examSession?.examRoom?.roomNumber ?? null,
            examOpenTime: item.examSession?.examOpenTime ?? null,
            examCloseTime: item.examSession?.examCloseTime ?? null,
            targetRoomNumber: item.targetExamSession?.examRoom?.roomNumber ?? null,
            targetExamOpenTime: item.targetExamSession?.examOpenTime ?? null,
            targetExamCloseTime: item.targetExamSession?.examCloseTime ?? null,
        }));

        return { data, total };
    }

    async delete(id: string): Promise<void> {
        await this.prisma.proctorApplication.delete({ where: { id } });
    }
}
