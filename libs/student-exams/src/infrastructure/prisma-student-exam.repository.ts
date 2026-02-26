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
            status: studentExam.status as any,
            currentLocation: studentExam.currentLocation,
            identityId: studentExam.identityId,
            isMatched: studentExam.isMatched,
            checkinTime: studentExam.checkinTime,
            checkoutTime: studentExam.checkoutTime,
            isValid: studentExam.isValid,
            updatedAt: studentExam.updatedAt,
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
                status: true,
                currentLocation: true,
                identityId: true,
                isMatched: true,
                checkinTime: true,
                checkoutTime: true,
                isValid: true,
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
            status: saved.status,
            currentLocation: saved.currentLocation,
            identityId: saved.identityId,
            isMatched: saved.isMatched,
            checkinTime: saved.checkinTime,
            checkoutTime: saved.checkoutTime,
            isValid: saved.isValid,
            createdAt: saved.createdAt,
            updatedAt: saved.updatedAt,
        });
    }

    async findById(id: string): Promise<StudentExam | null> {
        const found = await this.prisma.studentExam.findUnique({
            where: { id },
            include: { student: true },
        });

        if (!found) return null;

        return StudentExam.reconstitute({
            id: found.id,
            examSessionId: found.examSessionId,
            studentId: found.studentId,
            seatNumber: found.seatNumber,
            seatPosition: found.seatPosition,
            status: found.status,
            currentLocation: found.currentLocation,
            identityId: found.identityId,
            isMatched: found.isMatched,
            checkinTime: found.checkinTime,
            checkoutTime: found.checkoutTime,
            isValid: found.isValid,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
            studentName: found.student?.fullName,
            studentCode: found.student?.code,
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
            status: item.status,
            currentLocation: item.currentLocation,
            identityId: item.identityId,
            isMatched: item.isMatched,
            checkinTime: item.checkinTime,
            checkoutTime: item.checkoutTime,
            isValid: item.isValid,
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
            status: item.status,
            currentLocation: item.currentLocation,
            identityId: item.identityId,
            isMatched: item.isMatched,
            checkinTime: item.checkinTime,
            checkoutTime: item.checkoutTime,
            isValid: item.isValid,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            studentName: item.student?.fullName,
            studentCode: item.student?.code,
        }));
    }

    async findMany(criteria?: {
        examSessionId?: string;
        studentId?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{ data: StudentExam[]; total: number }> {
        const page = criteria?.page ?? 1;
        const limit = criteria?.limit ?? 10;
        const skip = (page - 1) * limit;

        const where: any = {};
        if (criteria?.examSessionId) where.examSessionId = criteria.examSessionId;
        if (criteria?.studentId) where.studentId = criteria.studentId;
        if (criteria?.status) where.status = criteria.status;

        const [results, total] = await Promise.all([
            this.prisma.studentExam.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { student: true },
            }),
            this.prisma.studentExam.count({ where }),
        ]);

        const data = results.map(item => StudentExam.reconstitute({
            id: item.id,
            examSessionId: item.examSessionId,
            studentId: item.studentId,
            seatNumber: item.seatNumber,
            seatPosition: item.seatPosition,
            status: item.status,
            currentLocation: item.currentLocation,
            identityId: item.identityId,
            isMatched: item.isMatched,
            checkinTime: item.checkinTime,
            checkoutTime: item.checkoutTime,
            isValid: item.isValid,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
            studentName: item.student?.fullName,
            studentCode: item.student?.code,
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
}
