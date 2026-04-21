import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { ExamRoom } from '../domain/entities';
import { IExamRoomRepository } from '../domain/repositories';

/**
 * Prisma implementation of ExamRoom Repository (Adapter)
 */
@Injectable()
export class PrismaExamRoomRepository implements IExamRoomRepository {
    constructor(private readonly prisma: PrismaService) { }

    async save(examRoom: ExamRoom): Promise<ExamRoom> {
        const data: any = {
            roomNumber: examRoom.roomNumber.value,
            capacity: examRoom.capacity?.value ?? null,
            status: examRoom.status as any,
            max_rows: examRoom.maxRows,
            max_columns: examRoom.maxColumns,
            total_seats: examRoom.totalSeats,
            updatedAt: examRoom.updatedAt,
            campus: examRoom.campus as any,
        };

        const saved = await this.prisma.examRoom.upsert({
            where: { id: examRoom.id },
            create: {
                id: examRoom.id,
                ...data,
                createdAt: examRoom.createdAt,
            },
            update: data,
        });

        return ExamRoom.mapFromPrisma(saved);
    }

    async findById(id: string): Promise<ExamRoom | null> {
        const found = await this.prisma.examRoom.findUnique({
            where: { id },
        });

        if (!found) return null;

        return ExamRoom.mapFromPrisma(found);
    }

    async findMany(query?: {
        roomNumber?: string;
        campus?: string | string[];
        skip?: number;
        take?: number;
    }): Promise<ExamRoom[]> {
        const where: any = {};

        if (query?.roomNumber !== undefined) {
            where.roomNumber = query.roomNumber;
        }

        if (query?.campus !== undefined) {
            if (Array.isArray(query.campus)) {
                where.campus = { in: query.campus };
            } else {
                where.campus = query.campus as any;
            }
        }

        const skipVal = isNaN(query?.skip) || query?.skip < 0 ? 0 : Math.floor(query.skip);
        const takeVal = isNaN(query?.take) || query?.take <= 0 ? undefined : Math.floor(query.take);

        const found = await this.prisma.examRoom.findMany({
            where,
            skip: skipVal,
            take: takeVal,
            orderBy: { createdAt: 'desc' },
        });

        return found.map((item) => ExamRoom.mapFromPrisma(item));
    }

    async findOne(query: { roomNumber: string; campus?: string }): Promise<ExamRoom | null> {
        const where: any = { roomNumber: query.roomNumber };
        if (query.campus) where.campus = query.campus as any;

        const found = await this.prisma.examRoom.findFirst({
            where,
        });

        if (!found) return null;

        return ExamRoom.mapFromPrisma(found);
    }

    async exists(query: { id?: string; roomNumber?: string; campus?: string }): Promise<boolean> {
        const where: any = {};

        if (query.id) where.id = query.id;
        if (query.roomNumber !== undefined) where.roomNumber = query.roomNumber;
        if (query.campus !== undefined) {
            if (Array.isArray(query.campus)) {
                where.campus = { in: query.campus };
            } else {
                where.campus = query.campus as any;
            }
        }

        const count = await this.prisma.examRoom.count({ where });
        return count > 0;
    }

    async count(query?: { roomNumber?: string; campus?: string | string[] }): Promise<number> {
        const where: any = {};

        if (query?.roomNumber !== undefined) {
            where.roomNumber = query.roomNumber;
        }

        if (query?.campus !== undefined) {
            if (Array.isArray(query.campus)) {
                where.campus = { in: query.campus };
            } else {
                where.campus = query.campus as any;
            }
        }

        return this.prisma.examRoom.count({ where });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.examRoom.delete({
            where: { id },
        });
    }

    async deleteMany(query: { roomNumber?: string; campus?: string }): Promise<number> {
        const where: any = {};

        if (query.roomNumber !== undefined) {
            where.roomNumber = query.roomNumber;
        }

        if (query.campus !== undefined) {
            where.campus = query.campus as any;
        }

        const { count } = await this.prisma.examRoom.deleteMany({
            where,
        });

        return count;
    }
}
