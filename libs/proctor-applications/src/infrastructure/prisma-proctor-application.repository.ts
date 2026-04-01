import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { ProctorApplication } from '../domain/entities';
import { IProctorApplicationRepository } from '../domain/repositories';

@Injectable()
export class PrismaProctorApplicationRepository implements IProctorApplicationRepository {
    constructor(private readonly prisma: PrismaService) { }

    private toDomain(item: any): ProctorApplication {
        return ProctorApplication.reconstitute({
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
        });
    }

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

        return this.toDomain(saved);
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

        return this.toDomain(found);
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

        return results.map((item) => this.toDomain(item));
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
                where.preferredDate.gte = criteria.preferredDateStart.toISOString().split('T')[0];
            }
            if (criteria.preferredDateEnd) {
                where.preferredDate.lte = criteria.preferredDateEnd.toISOString().split('T')[0];
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
                            fullName: true,
                            code: true,
                        },
                    },
                },
                skip: skipVal,
                take: limitVal,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.proctorApplication.count({ where }),
        ]);

        const data = results.map((item) => this.toDomain(item));

        return { data, total };
    }

    async delete(id: string): Promise<void> {
        await this.prisma.proctorApplication.delete({ where: { id } });
    }
}
