import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { ExamPart, IExamPartRepository } from '../domain';

@Injectable()
export class PrismaExamPartRepository implements IExamPartRepository {
    constructor(private readonly prisma: PrismaService) { }

    async save(examPart: ExamPart): Promise<ExamPart> {
        const data = {
            code: examPart.code,
            name: examPart.name,
            description: examPart.description,
            updatedAt: new Date(),
        };

        const result = await this.prisma.examPart.upsert({
            where: { id: examPart.id },
            update: data,
            create: {
                id: examPart.id,
                ...data,
                createdAt: examPart.createdAt,
            },
        });

        return ExamPart.mapFromPrisma(result);
    }

    async findById(id: string): Promise<ExamPart | null> {
        const result = await this.prisma.examPart.findUnique({
            where: { id },
        });

        return result ? ExamPart.mapFromPrisma(result) : null;
    }

    async findByCode(code: string): Promise<ExamPart | null> {
        const result = await this.prisma.examPart.findUnique({
            where: { code },
        });

        return result ? ExamPart.mapFromPrisma(result) : null;
    }

    async findAll(): Promise<ExamPart[]> {
        const results = await this.prisma.examPart.findMany({
            orderBy: { code: 'asc' },
        });

        return results.map(ExamPart.mapFromPrisma);
    }

    async exists(query: { id?: string; code?: string }): Promise<boolean> {
        if (!query.id && !query.code) return false;

        const count = await this.prisma.examPart.count({
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
        await this.prisma.examPart.delete({
            where: { id },
        });
    }
}
