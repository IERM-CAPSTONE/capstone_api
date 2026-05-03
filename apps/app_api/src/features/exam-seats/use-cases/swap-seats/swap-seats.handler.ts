import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { logSessionActivity } from '../../../../common/utils/activity-history.util';
import { Prisma } from '@prisma/client';

@Injectable()
export class SwapSeatsHandler {
    private readonly logger = new Logger(SwapSeatsHandler.name);

    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async handle(sourceSeatId: string, targetSeatId: string, examSessionId: string) {
        this.logger.log(`Swapping seats: ${sourceSeatId} <-> ${targetSeatId}`);

        if (sourceSeatId === targetSeatId) {
            throw new BadRequestException('Source and target seats must be different');
        }

        // 1. Fetch both seats
        const [sourceSeat, targetSeat] = await Promise.all([
            this.prisma.examSeat.findUnique({ where: { id: sourceSeatId } }),
            this.prisma.examSeat.findUnique({ where: { id: targetSeatId } })
        ]);

        if (!sourceSeat || !targetSeat) {
            throw new BadRequestException('One or both seats not found');
        }

        // 2. Verify both seats belong to same session
        if (sourceSeat.examSessionId !== examSessionId || targetSeat.examSessionId !== examSessionId) {
            throw new BadRequestException('Seats must belong to the same exam session');
        }

        // 3. Snapshot students currently assigned on source/target seats
        const [sourceStudents, targetStudents] = await Promise.all([
            this.prisma.studentExam.findMany({
                where: {
                    examSessionId,
                    seatPosition: sourceSeatId,
                },
                select: {
                    id: true,
                    studentId: true,
                },
            }),
            this.prisma.studentExam.findMany({
                where: {
                    examSessionId,
                    seatPosition: targetSeatId,
                },
                select: {
                    id: true,
                    studentId: true,
                },
            }),
        ]);

        // 4. Swap seat assignments and normalize seat statuses in transaction
        await this.prisma.$transaction(async (tx) => {
            await tx.$executeRaw(
                Prisma.sql`
                  UPDATE "StudentExam"
                  SET "seatPosition" = CASE
                    WHEN "seatPosition" = ${sourceSeatId} THEN ${targetSeatId}
                    WHEN "seatPosition" = ${targetSeatId} THEN ${sourceSeatId}
                    ELSE "seatPosition"
                  END
                  WHERE "examSessionId" = ${examSessionId}
                    AND "seatPosition" IN (${sourceSeatId}, ${targetSeatId})
                `,
            );

            const assignedSeatRows = await tx.studentExam.findMany({
                where: {
                    examSessionId,
                    seatPosition: {
                        not: null,
                    },
                },
                select: {
                    seatPosition: true,
                },
                distinct: ['seatPosition'],
            });

            const assignedSeatIds = assignedSeatRows
                .map((row) => row.seatPosition)
                .filter((value): value is string => Boolean(value));

            if (assignedSeatIds.length > 0) {
                await tx.examSeat.updateMany({
                    where: {
                        examSessionId,
                        status: 'Available',
                        id: {
                            in: assignedSeatIds,
                        },
                    },
                    data: {
                        status: 'Assigned',
                    },
                });
            }

            await tx.examSeat.updateMany({
                where: {
                    examSessionId,
                    status: 'Assigned',
                    id: assignedSeatIds.length > 0
                        ? {
                            notIn: assignedSeatIds,
                        }
                        : undefined,
                },
                data: {
                    status: 'Available',
                },
            });
        });

        this.logger.log(`Successfully swapped seats ${sourceSeatId} <-> ${targetSeatId}`);

        await logSessionActivity(this.prisma, {
            sessionId: examSessionId,
            activityType: 'SEAT_MOVED',
            payload: {
                event: 'STUDENT_SWAPPED_SEATS',
                title: 'Seat Swap',
                message: `Seats were swapped (${sourceSeatId} <-> ${targetSeatId})`,
                meta: {
                    sourceSeatId,
                    targetSeatId,
                    sourceStudentIds: sourceStudents.map((student) => student.studentId),
                    targetStudentIds: targetStudents.map((student) => student.studentId),
                },
            },
        });

        return {
            success: true,
            message: 'Seats swapped successfully',
            data: {
                sourceSeatId,
                targetSeatId,
                swappedStudents: [sourceStudents.length > 0, targetStudents.length > 0],
            }
        };
    }
}
