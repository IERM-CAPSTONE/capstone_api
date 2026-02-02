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
                        fullName: true,
                        code: true,
                    },
                },
            },
        });

        return ProctorApplication.reconstitute({
            id: saved.id,
            teacherId: saved.teacherId,
            preferredShift: saved.preferredShift,
            preferredType: saved.preferredType,
            preferredDate: saved.preferredDate,
            notes: saved.notes,
            status: saved.status,
            createdAt: saved.createdAt,
            updatedAt: saved.updatedAt,
            teacherName: saved.teacher?.fullName,
            teacherCode: saved.teacher?.code,
        });
    }

    async findById(id: string): Promise<ProctorApplication | null> {
        const found = await this.prisma.proctorApplication.findUnique({
            where: { id },
            include: {
                teacher: {
                    select: {
                        fullName: true,
                        code: true,
                    },
                },
            },
        });

        if (!found) return null;

        return ProctorApplication.reconstitute({
            id: found.id,
            teacherId: found.teacherId,
            preferredShift: found.preferredShift,
            preferredType: found.preferredType,
            preferredDate: found.preferredDate,
            notes: found.notes,
            status: found.status,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
            teacherName: found.teacher?.fullName,
            teacherCode: found.teacher?.code,
        });
    }

    async findByTeacherId(teacherId: string): Promise<ProctorApplication[]> {
        const results = await this.prisma.proctorApplication.findMany({
            where: { teacherId },
            include: {
                teacher: {
                    select: {
                        fullName: true,
                        code: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return results.map(item => ProctorApplication.reconstitute({
            id: item.id,
            teacherId: item.teacherId,
            preferredShift: item.preferredShift,
            preferredType: item.preferredType,
            preferredDate: item.preferredDate,
            notes: item.notes,
            status: item.status,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            teacherName: item.teacher?.fullName,
            teacherCode: item.teacher?.code,
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

        const [results, total] = await Promise.all([
            this.prisma.proctorApplication.findMany({
                where,
                include: {
                    teacher: {
                        select: {
                            fullName: true,
                            code: true,
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.proctorApplication.count({ where }),
        ]);

        const data = results.map(item => ProctorApplication.reconstitute({
            id: item.id,
            teacherId: item.teacherId,
            preferredShift: item.preferredShift,
            preferredType: item.preferredType,
            preferredDate: item.preferredDate,
            notes: item.notes,
            status: item.status,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            teacherName: item.teacher?.fullName,
            teacherCode: item.teacher?.code,
        }));

        return { data, total };
    }

    async delete(id: string): Promise<void> {
        await this.prisma.proctorApplication.delete({ where: { id } });
    }
}
