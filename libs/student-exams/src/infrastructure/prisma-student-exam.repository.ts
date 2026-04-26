import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { StudentExam } from '../domain/entities';
import { IStudentExamRepository } from '../domain/repositories';

type StudentMeta = {
    fullName?: string | null;
    code?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
};

type StudentExamWithMeta = StudentExam & {
    studentAvatarUrl?: string | null;
    student?: StudentMeta | null;
    hasFaceRegistered?: boolean;
};

const attachStudentMeta = (
    exam: StudentExam,
    student: StudentMeta | null | undefined,
    hasFaceRegistered = false,
): StudentExamWithMeta =>
    Object.assign(exam, {
        studentAvatarUrl: student?.avatarUrl ?? null,
        student: student ?? null,
        hasFaceRegistered,
    });

@Injectable()
export class PrismaStudentExamRepository implements IStudentExamRepository {
    constructor(private readonly prisma: PrismaService) { }

    private async getRegisteredStudentIds(studentIds: string[]): Promise<Set<string>> {
        const uniqueStudentIds = [...new Set(studentIds.filter(Boolean))];
        if (uniqueStudentIds.length === 0) {
            return new Set();
        }

        const identities = await this.prisma.identity.findMany({
            where: { studentId: { in: uniqueStudentIds } },
            select: { studentId: true },
        });

        return new Set(identities.map(identity => identity.studentId));
    }

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

        const exam = StudentExam.reconstitute({
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
            studentEmail: found.student?.email,
            parts: (found as any).parts,
        });

        const registeredStudentIds = await this.getRegisteredStudentIds([found.studentId]);
        return attachStudentMeta(exam, found.student, registeredStudentIds.has(found.studentId));
    }

    async findByExamSessionId(examSessionId: string): Promise<StudentExam[]> {
        const results = await this.prisma.studentExam.findMany({
            where: { examSessionId },
            include: { student: true },
        });

        const registeredStudentIds = await this.getRegisteredStudentIds(
            results.map(item => item.studentId),
        );

        return results.map(item => {
            const exam = StudentExam.reconstitute({
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
            });

            return attachStudentMeta(exam, item.student, registeredStudentIds.has(item.studentId));
        });
    }

    async findByStudentId(studentId: string): Promise<StudentExam[]> {
        const results = await this.prisma.studentExam.findMany({
            where: { studentId },
            include: { student: true },
        });

        const registeredStudentIds = await this.getRegisteredStudentIds(
            results.map(item => item.studentId),
        );

        return results.map(item => {
            const exam = StudentExam.reconstitute({
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
            });

            return attachStudentMeta(exam, item.student, registeredStudentIds.has(item.studentId));
        });
    }

    async findMany(criteria?: {
        examSessionId?: string;
        studentId?: string;
        studentCode?: string;
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
        if (criteria?.studentCode) {
            where.student = {
                code: {
                    equals: criteria.studentCode,
                    mode: 'insensitive',
                },
            };
        }

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

        const registeredStudentIds = await this.getRegisteredStudentIds(
            results.map(item => item.studentId),
        );

        const data = results.map(item => {
            const exam = StudentExam.reconstitute({
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
                studentEmail: item.student?.email,
                parts: (item as any).parts,
            });

            return attachStudentMeta(exam, item.student, registeredStudentIds.has(item.studentId));
        });

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

    async checkIn(studentId: string, examSessionId: string, examPartCode?: string): Promise<void> {
        // 1. Find the student exam record
        const studentExam = await this.prisma.studentExam.findFirst({
            where: { studentId, examSessionId }
        });

        if (!studentExam) {
            throw new BadRequestException(`Student ${studentId} is not assigned to exam session ${examSessionId}`);
        }

        const now = new Date();

        // 2. Prepare the update condition
        const whereClause: any = { studentExamId: studentExam.id };
        let normalizedExamPartCode: string | undefined;
        if (examPartCode) {
            normalizedExamPartCode = examPartCode.trim().toUpperCase();
            // Find by specific part code if provided
            const part = await this.prisma.examPart.findFirst({
                where: {
                    code: {
                        equals: normalizedExamPartCode,
                        mode: 'insensitive',
                    },
                },
            });
            if (!part) {
                throw new BadRequestException(`Exam part ${normalizedExamPartCode} not found`);
            }
            whereClause.examPartId = part.id;
        }

        // 3. Persist attendance consistently across part, student exam, and seat
        await this.prisma.$transaction(async (tx) => {
            const updatedParts = await tx.studentExamPart.updateMany({
                where: whereClause,
                data: {
                    isCheckedIn: true,
                    checkInTime: now,
                }
            });

            if (updatedParts.count === 0) {
                throw new BadRequestException(
                    normalizedExamPartCode
                        ? `No StudentExamPart found for exam part ${normalizedExamPartCode}`
                        : `No StudentExamPart found for student exam ${studentExam.id}`,
                );
            }

            if (studentExam.seatPosition) {
                await tx.examSeat.update({
                    where: { id: studentExam.seatPosition },
                    data: {
                        status: 'Present',
                    },
                });
            }
        });

        console.log(`[Repository] Checked in student ${studentId} for session ${examSessionId}${normalizedExamPartCode ? ` (Part: ${normalizedExamPartCode})` : ' (All parts)'}`);
    }
}
