import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { Semester, ISemesterRepository } from '../domain';

@Injectable()
export class PrismaSemesterRepository implements ISemesterRepository {
    constructor(private readonly prisma: PrismaService) { }

    async save(semester: Semester): Promise<Semester> {
        const data = {
            code: semester.code,
            name: semester.name,
            startDate: semester.startDate,
            endDate: semester.endDate,
            updatedAt: new Date(),
        };

        const result = await this.prisma.semester.upsert({
            where: { id: semester.id },
            update: data,
            create: {
                id: semester.id,
                ...data,
                createdAt: semester.createdAt,
            },
        });

        return Semester.mapFromPrisma(result);
    }

    async findById(id: string): Promise<Semester | null> {
        const result = await this.prisma.semester.findUnique({
            where: { id },
        });

        return result ? Semester.mapFromPrisma(result) : null;
    }

    async findByCode(code: string): Promise<Semester | null> {
        const result = await this.prisma.semester.findUnique({
            where: { code },
        });

        return result ? Semester.mapFromPrisma(result) : null;
    }

    async findAll(query?: { search?: string }): Promise<Semester[]> {
        const where: any = {};
        if (query?.search) {
            where.OR = [
                { code: { contains: query.search, mode: 'insensitive' } },
                { name: { contains: query.search, mode: 'insensitive' } },
            ];
        }

        const results = await this.prisma.semester.findMany({
            where,
            orderBy: { startDate: 'desc' },
        });

        return results.map(Semester.mapFromPrisma);
    }

    async findAllWithPagination(query: {
        page: number;
        limit: number;
        search?: string;
    }): Promise<{ items: Semester[]; total: number }> {
        const { page, limit, search } = query;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [results, total] = await Promise.all([
            this.prisma.semester.findMany({
                where,
                skip,
                take: limit,
                orderBy: { startDate: 'desc' },
            }),
            this.prisma.semester.count({ where }),
        ]);

        return {
            items: results.map(Semester.mapFromPrisma),
            total,
        };
    }

    async exists(query: { id?: string; code?: string }): Promise<boolean> {
        if (!query.id && !query.code) return false;

        const count = await this.prisma.semester.count({
            where: {
                OR: [
                    query.id ? { id: query.id } : {},
                    query.code ? { code: query.code } : {},
                ].filter(obj => Object.keys(obj).length > 0),
            },
        });

        return count > 0;
    }

    async delete(id: string): Promise<void> {
        await this.prisma.semester.delete({
            where: { id },
        });
    }
}
