import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { ExamType, IExamTypeRepository } from '../domain';

@Injectable()
export class PrismaExamTypeRepository implements IExamTypeRepository {
    constructor(private readonly prisma: PrismaService) { }

    async save(examType: ExamType): Promise<ExamType> {
        const data = {
            code: examType.code,
            name: examType.name,
            description: examType.description,
            updatedAt: new Date(),
        };

        const result = await this.prisma.examType.upsert({
            where: { id: examType.id },
            update: data,
            create: {
                id: examType.id,
                ...data,
                createdAt: examType.createdAt,
            },
        });

        return ExamType.mapFromPrisma(result);
    }

    async findById(id: string): Promise<ExamType | null> {
        const result = await this.prisma.examType.findUnique({
            where: { id },
        });

        return result ? ExamType.mapFromPrisma(result) : null;
    }

    async findByCode(code: string): Promise<ExamType | null> {
        const result = await this.prisma.examType.findUnique({
            where: { code },
        });

        return result ? ExamType.mapFromPrisma(result) : null;
    }

    async findAll(): Promise<ExamType[]> {
        const results = await this.prisma.examType.findMany({
            orderBy: { code: 'asc' },
        });

        return results.map(ExamType.mapFromPrisma);
    }

    async exists(query: { id?: string; code?: string }): Promise<boolean> {
        if (!query.id && !query.code) return false;

        const count = await this.prisma.examType.count({
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
        await this.prisma.examType.delete({
            where: { id },
        });
    }
}
