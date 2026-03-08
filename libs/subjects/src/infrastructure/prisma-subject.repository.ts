import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { Subject, SubjectPart, ISubjectRepository } from '../domain';

@Injectable()
export class PrismaSubjectRepository implements ISubjectRepository {
    constructor(private readonly prisma: PrismaService) { }

    async save(subject: Subject): Promise<Subject> {
        const data = {
            code: subject.code,
            name: subject.name,
            semesterId: subject.semesterId,
            department: subject.department,
            isCoursera: subject.isCoursera,
            updatedAt: new Date(),
        };

        const result = await this.prisma.subject.upsert({
            where: { id: subject.id },
            update: data,
            create: {
                id: subject.id,
                ...data,
                createdAt: subject.createdAt,
            },
            include: {
                parts: { include: { examPart: true } },
                semester: true
            },
        });

        return Subject.mapFromPrisma(result);
    }

    async findById(id: string): Promise<Subject | null> {
        const result = await this.prisma.subject.findUnique({
            where: { id },
            include: {
                parts: { include: { examPart: true } },
                semester: true
            },
        });

        return result ? Subject.mapFromPrisma(result) : null;
    }

    async findByCode(code: string): Promise<Subject | null> {
        const result = await this.prisma.subject.findUnique({
            where: { code },
            include: {
                parts: { include: { examPart: true } },
                semester: true
            },
        });

        return result ? Subject.mapFromPrisma(result) : null;
    }

    async findAll(query?: { semesterId?: string; department?: string }): Promise<Subject[]> {
        const results = await this.prisma.subject.findMany({
            where: {
                semesterId: query?.semesterId,
                department: query?.department,
            },
            include: {
                parts: { include: { examPart: true } },
                semester: true
            },
            orderBy: { code: 'asc' },
        });

        return results.map(Subject.mapFromPrisma);
    }

    async findAllWithPagination(query: {
        semesterId?: string;
        department?: string;
        page: number;
        limit: number;
        search?: string;
    }): Promise<{ items: Subject[]; total: number }> {
        const { page, limit, semesterId, department, search } = query;
        const skip = (page - 1) * limit;

        const where: any = {
            semesterId: semesterId || undefined,
            department: department || undefined,
        };

        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
            ];
        }

        const skipVal = isNaN(skip) || skip < 0 ? 0 : Math.floor(skip);
        const limitVal = isNaN(limit) || limit <= 0 ? 10 : Math.floor(limit);

        const [results, total] = await Promise.all([
            this.prisma.subject.findMany({
                where,
                include: {
                    parts: { include: { examPart: true } },
                    semester: true
                },
                skip: skipVal,
                take: limitVal,
                orderBy: { code: 'asc' },
            }),
            this.prisma.subject.count({ where }),
        ]);

        return {
            items: results.map(Subject.mapFromPrisma),
            total,
        };
    }

    async exists(query: { id?: string; code?: string }): Promise<boolean> {
        if (!query.id && !query.code) return false;

        const count = await this.prisma.subject.count({
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
        // Cascade delete parts manually since we are in relationMode = "prisma"
        await this.prisma.subjectPart.deleteMany({
            where: { subjectId: id },
        });

        await this.prisma.subject.delete({
            where: { id },
        });
    }

    async savePart(part: SubjectPart): Promise<SubjectPart> {
        const data = {
            subjectId: part.subjectId,
            examPartId: part.examPartId,
            duration: part.duration,
            updatedAt: new Date(),
        };

        const result = await this.prisma.subjectPart.upsert({
            where: { id: part.id },
            update: data,
            create: {
                id: part.id,
                ...data,
                createdAt: part.createdAt,
            },
        });

        return SubjectPart.reconstitute({
            id: result.id,
            subjectId: result.subjectId,
            examPartId: result.examPartId,
            duration: result.duration,
            examPart: (result as any).examPart || null,
            createdAt: result.createdAt,
            updatedAt: result.updatedAt,
        });
    }

    async deletePart(id: string): Promise<void> {
        await this.prisma.subjectPart.delete({
            where: { id },
        });
    }

    async deleteAllPartsBySubjectId(subjectId: string): Promise<void> {
        await this.prisma.subjectPart.deleteMany({
            where: { subjectId },
        });
    }
}
