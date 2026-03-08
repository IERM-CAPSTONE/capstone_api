import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { StudentExam } from '../domain/entities';
import { IStudentExamRepository } from '../domain/repositories';

@Injectable()
export class PrismaStudentExamRepository implements IStudentExamRepository {
    constructor(private readonly prisma: PrismaService) { }

    async save(studentExam: StudentExam): Promise<StudentExam> {
        const data = {
            examSessionId: studentExam.examSessionId,
            studentId: studentExam.studentId,
            seatNumber: studentExam.seatNumber,
            seatPosition: studentExam.seatPosition,
            updatedAt: studentExam.updatedAt,
            stt: studentExam.stt,
        };

        const saved = await this.prisma.studentExam.upsert({
            where: { id: studentExam.id },
            create: {
                id: studentExam.id,
                ...data,
                createdAt: studentExam.createdAt,
            },
            update: data,
            select: {
                id: true,
                examSessionId: true,
                studentId: true,
                seatNumber: true,
                seatPosition: true,
                stt: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return StudentExam.reconstitute({
            id: saved.id,
            examSessionId: saved.examSessionId,
            studentId: saved.studentId,
            seatNumber: saved.seatNumber,
            seatPosition: saved.seatPosition,
            stt: saved.stt,
            createdAt: saved.createdAt,
            updatedAt: saved.updatedAt,
        });
    }

    async findById(id: string): Promise<StudentExam | null> {
        const found = await this.prisma.studentExam.findUnique({
            where: { id },
            include: {
                student: true,
                parts: { include: { examPart: true } }
            },
        });

        if (!found) return null;

        return StudentExam.reconstitute({
            id: found.id,
            examSessionId: found.examSessionId,
            studentId: found.studentId,
            seatNumber: found.seatNumber,
            seatPosition: found.seatPosition,
            stt: found.stt,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
            studentName: found.student?.fullName,
            studentCode: found.student?.code,
            parts: (found as any).parts,
        });
    }

    async findByExamSessionId(examSessionId: string): Promise<StudentExam[]> {
        const results = await this.prisma.studentExam.findMany({
            where: { examSessionId },
            include: { student: true },
        });

        return results.map(item => StudentExam.reconstitute({
            id: item.id,
            examSessionId: item.examSessionId,
            studentId: item.studentId,
            seatNumber: item.seatNumber,
            seatPosition: item.seatPosition,
            stt: item.stt,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            studentName: item.student?.fullName,
            studentCode: item.student?.code,
        }));
    }

    async findByStudentId(studentId: string): Promise<StudentExam[]> {
        const results = await this.prisma.studentExam.findMany({
            where: { studentId },
            include: { student: true },
        });

        return results.map(item => StudentExam.reconstitute({
            id: item.id,
            examSessionId: item.examSessionId,
            studentId: item.studentId,
            seatNumber: item.seatNumber,
            seatPosition: item.seatPosition,
            stt: item.stt,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            studentName: item.student?.fullName,
            studentCode: item.student?.code,
        }));
    }

    async findMany(criteria?: {
        examSessionId?: string;
        studentId?: string;
        page?: number;
        limit?: number;
    }): Promise<{ data: StudentExam[]; total: number }> {
        const page = criteria?.page ?? 1;
        const limit = criteria?.limit ?? 10;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (criteria?.examSessionId) where.examSessionId = criteria.examSessionId;
        if (criteria?.studentId) where.studentId = criteria.studentId;

        const [results, total] = await Promise.all([
            this.prisma.studentExam.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ stt: 'asc' }, { createdAt: 'desc' }],
                include: {
                    student: true,
                    parts: { include: { examPart: true } }
                },
            }),
            this.prisma.studentExam.count({ where }),
        ]);

        const data = results.map(item => StudentExam.reconstitute({
            id: item.id,
            examSessionId: item.examSessionId,
            studentId: item.studentId,
            seatNumber: item.seatNumber,
            seatPosition: item.seatPosition,
            stt: item.stt,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            studentName: item.student?.fullName,
            studentCode: item.student?.code,
            parts: (item as any).parts,
        }));

        return { data, total };
    }

    async delete(id: string): Promise<void> {
        await this.prisma.studentExam.delete({
            where: { id },
        });
    }

    async exists(criteria: { examSessionId: string; studentId: string }): Promise<boolean> {
        const count = await this.prisma.studentExam.count({
            where: {
                examSessionId: criteria.examSessionId,
                studentId: criteria.studentId,
            },
        });
        return count > 0;
    }

    async checkIn(studentId: string, examSessionId: string): Promise<void> {
        // Method placeholder - checkIn logic needs to be redesigned based on the new schema
        // since status and checkinTime were removed from StudentExam
    }
}
