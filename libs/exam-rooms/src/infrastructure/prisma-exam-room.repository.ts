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
        });

        return ExamRoom.reconstitute({
            id: saved.id,
            roomNumber: saved.roomNumber,
            capacity: saved.capacity,
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
