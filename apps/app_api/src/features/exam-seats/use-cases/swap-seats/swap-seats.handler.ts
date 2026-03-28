import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { logSessionActivity } from '../../../../common/utils/activity-history.util';

interface SwapSeatsDto {
  targetSeatId: string;
}

@Injectable()
export class SwapSeatsHandler {
    private readonly logger = new Logger(SwapSeatsHandler.name);

    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async handle(sourceSeatId: string, targetSeatId: string, examSessionId: string) {
        this.logger.log(`Swapping seats: ${sourceSeatId} <-> ${targetSeatId}`);

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

        // 3. Verify session has students imported (layout finalized)
        const session = await this.prisma.examSession.findUnique({
            where: { id: examSessionId }
        });

        if (!session || !session.hasStudentsImported) {
            throw new BadRequestException('Seat swapping only enabled after layout is finalized');
        }

        // 4. Check if either seat is locked
        if (sourceSeat.status === 'Locked' || targetSeat.status === 'Locked') {
            throw new BadRequestException('Cannot swap locked seats');
        }

        // 5. Check if seats have students (must have at least one student)
        const [sourceStudent, targetStudent] = await Promise.all([
            this.prisma.studentExam.findFirst({
                where: { seatPosition: sourceSeatId }
            }),
            this.prisma.studentExam.findFirst({
                where: { seatPosition: targetSeatId }
            })
        ]);

        // Allow swapping if one or both have students
        // (e.g., swap Assigned seat with Available seat)

        // 6. Swap in transaction
        await this.prisma.$transaction(async (tx) => {
            // Update source student (if exists) to target seat
            if (sourceStudent) {
                await tx.studentExam.update({
                    where: { id: sourceStudent.id },
                    data: { seatPosition: targetSeatId }
                });
            }

            // Update target student (if exists) to source seat
            if (targetStudent) {
                await tx.studentExam.update({
                    where: { id: targetStudent.id },
                    data: { seatPosition: sourceSeatId }
                });
            }

            // Update seat statuses based on updated assignments
            // Source seat: if targetStudent moved in, it's Assigned; otherwise Available
            await tx.examSeat.update({
                where: { id: sourceSeatId },
                data: { 
                    status: targetStudent ? 'Assigned' : 'Available'
                }
            });

            // Target seat: if sourceStudent moved in, it's Assigned; otherwise Available
            await tx.examSeat.update({
                where: { id: targetSeatId },
                data: { 
                    status: sourceStudent ? 'Assigned' : 'Available'
                }
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
                    sourceStudentId: sourceStudent?.studentId ?? null,
                    targetStudentId: targetStudent?.studentId ?? null,
                },
            },
        });

        return {
            success: true,
            message: 'Seats swapped successfully',
            data: {
                sourceSeatId,
                targetSeatId,
                swappedStudents: [!!sourceStudent, !!targetStudent]
            }
        };
    }
}
