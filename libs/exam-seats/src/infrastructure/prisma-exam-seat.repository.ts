import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { ExamSeat, ExamSeatStatusType } from '../domain/entities';
import { IExamSeatRepository } from '../domain/repositories';

@Injectable()
export class PrismaExamSeatRepository implements IExamSeatRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(): Promise<ExamSeat[]> {
        const found = await this.prisma.examSeat.findMany({
            orderBy: [
                { examSessionId: 'asc' },
                { row: 'asc' },
                { col: 'asc' },
            ],
        });

        return found.map(seat =>
            ExamSeat.reconstitute({
                id: seat.id,
                examSessionId: seat.examSessionId,
                row: seat.row,
                col: seat.col,
                status: seat.status as ExamSeatStatusType,
                createdAt: seat.createdAt,
                updatedAt: seat.updatedAt,
            })
        );
    }

    async findById(id: string): Promise<ExamSeat | null> {
        const found = await this.prisma.examSeat.findUnique({
            where: { id },
        });

        if (!found) return null;

        return ExamSeat.reconstitute({
            id: found.id,
            examSessionId: found.examSessionId,
            row: found.row,
            col: found.col,
            status: found.status as ExamSeatStatusType,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
        });
    }

    async findBySession(examSessionId: string, status?: string): Promise<ExamSeat[]> {
        const where: any = { examSessionId };
        if (status) {
            where.status = status;
        }

        const found = await this.prisma.examSeat.findMany({
            where,
            orderBy: [
                { row: 'asc' },
                { col: 'asc' },
            ],
        });

        return found.map(seat =>
            ExamSeat.reconstitute({
                id: seat.id,
                examSessionId: seat.examSessionId,
                row: seat.row,
                col: seat.col,
                status: seat.status as ExamSeatStatusType,
                createdAt: seat.createdAt,
                updatedAt: seat.updatedAt,
            })
        );
    }

    async findByCoordinate(examSessionId: string, row: number, col: number): Promise<ExamSeat | null> {
        const found = await this.prisma.examSeat.findUnique({
            where: {
                unique_session_seat: {
                    examSessionId,
                    row,
                    col,
                }
            },
        });

        if (!found) return null;

        return ExamSeat.reconstitute({
            id: found.id,
            examSessionId: found.examSessionId,
            row: found.row,
            col: found.col,
            status: found.status as ExamSeatStatusType,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
        });
    }

    async save(examSeat: ExamSeat): Promise<ExamSeat> {
        const data = {
            examSessionId: examSeat.examSessionId,
            row: examSeat.row,
            col: examSeat.col,
            status: examSeat.status as any,
            updatedAt: examSeat.updatedAt,
        };

        const saved = await this.prisma.examSeat.upsert({
            where: { id: examSeat.id },
            create: {
                id: examSeat.id,
                ...data,
                createdAt: examSeat.createdAt,
            },
            update: data,
        });

        return ExamSeat.reconstitute({
            id: saved.id,
            examSessionId: saved.examSessionId,
            row: saved.row,
            col: saved.col,
            status: saved.status as ExamSeatStatusType,
            createdAt: saved.createdAt,
            updatedAt: saved.updatedAt,
        });
    }

    async saveMany(examSeats: ExamSeat[]): Promise<ExamSeat[]> {
        if (examSeats.length === 0) return [];

        // Use Prisma ORM for batch insert (handles table names and UUID generation properly)
        const seatData = examSeats.map(seat => ({
            id: seat.id,
            examSessionId: seat.examSessionId,
            row: seat.row,
            col: seat.col,
            status: seat.status as any,
            createdAt: seat.createdAt,
            updatedAt: seat.updatedAt,
        }));

        await this.prisma.examSeat.createMany({
            data: seatData,
            skipDuplicates: true,
        });

        return examSeats;
    }

    async delete(id: string): Promise<void> {
        await this.prisma.examSeat.delete({
            where: { id },
        }).catch((error) => {
            if (error.code === 'P2025') {
                throw new BadRequestException(`ExamSeat with id ${id} not found`);
            }
            throw error;
        });
    }

    async countBySessionAndStatus(examSessionId: string, status: string): Promise<number> {
        return this.prisma.examSeat.count({
            where: {
                examSessionId,
                status: status as any,
            },
        });
    }
}
