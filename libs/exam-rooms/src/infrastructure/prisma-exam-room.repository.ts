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
        const data = {
            roomNumber: examRoom.roomNumber.value,
            capacity: examRoom.capacity?.value ?? null,
            status: examRoom.status as any,
            max_rows: examRoom.max_rows ?? null,
            max_columns: examRoom.max_columns ?? null,
            total_seats: examRoom.total_seats ?? null,
            updatedAt: examRoom.updatedAt,
        };

        const saved = await this.prisma.examRoom.upsert({
            where: { id: examRoom.id },
            create: {
                id: examRoom.id,
                ...data,
                createdAt: examRoom.createdAt,
            },
            update: data,
            select: {
                id: true,
                roomNumber: true,
                capacity: true,
                status: true,
                max_rows: true,
                max_columns: true,
                total_seats: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return ExamRoom.reconstitute({
            id: saved.id,
            roomNumber: saved.roomNumber,
            capacity: saved.capacity,
            status: saved.status,
            max_rows: saved.max_rows,
            max_columns: saved.max_columns,
            total_seats: saved.total_seats,
            createdAt: saved.createdAt,
            updatedAt: saved.updatedAt,
        });
    }

    async findById(id: string): Promise<ExamRoom | null> {
        const found = await this.prisma.examRoom.findUnique({
            where: { id },
        });

        if (!found) return null;

        return ExamRoom.reconstitute({
            id: found.id,
            roomNumber: found.roomNumber,
            capacity: found.capacity,
            status: found.status,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
        });
    }

    async findMany(query?: {
        roomNumber?: string;
        skip?: number;
        take?: number;
    }): Promise<ExamRoom[]> {
        const where: any = {};

        if (query?.roomNumber !== undefined) {
            where.roomNumber = query.roomNumber;
        }

        const found = await this.prisma.examRoom.findMany({
            where,
            skip: query?.skip,
            take: query?.take,
            orderBy: { createdAt: 'desc' },
        });

        return found.map((item) =>
            ExamRoom.reconstitute({
                id: item.id,
                roomNumber: item.roomNumber,
                capacity: item.capacity,
                status: item.status,
                max_rows: item.max_rows,
                max_columns: item.max_columns,
                total_seats: item.total_seats,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            }),
        );
    }

    async findOne(query: { roomNumber: string }): Promise<ExamRoom | null> {
        const found = await this.prisma.examRoom.findFirst({
            where: { roomNumber: query.roomNumber },
        });

        if (!found) return null;

        return ExamRoom.reconstitute({
            id: found.id,
            roomNumber: found.roomNumber,
            capacity: found.capacity,
            status: found.status,
            max_rows: found.max_rows,
            max_columns: found.max_columns,
            total_seats: found.total_seats,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
        });
    }

    async exists(query: { id?: string; roomNumber?: string }): Promise<boolean> {
        const where: any = {};

        if (query.id) where.id = query.id;
        if (query.roomNumber !== undefined) where.roomNumber = query.roomNumber;

        const count = await this.prisma.examRoom.count({ where });
        return count > 0;
    }

    async count(query?: { roomNumber?: string }): Promise<number> {
        const where: any = {};

        if (query?.roomNumber !== undefined) {
            where.roomNumber = query.roomNumber;
        }

        return this.prisma.examRoom.count({ where });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.examRoom.delete({
            where: { id },
        });
    }
}
