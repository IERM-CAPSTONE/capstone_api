import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FinalizeSeatAssignmentsHandler {
    private readonly logger = new Logger(FinalizeSeatAssignmentsHandler.name);

    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async handle(examSessionId: string) {
        this.logger.log(`Finalizing seat assignments for session ${examSessionId}`);

        // 1. Get session
        const session = await this.prisma.examSession.findUnique({
            where: { id: examSessionId },
            include: { examRoom: true }
        });

        if (!session) {
            throw new BadRequestException('Exam session not found');
        }

        // 2. Get students without seat assignments
        const students = await this.prisma.studentExam.findMany({
            where: {
                examSessionId,
                seatPosition: null, // Only students without physical seats
            },
            orderBy: { seatNumber: 'asc' }
        });

        if (students.length === 0) {
            throw new BadRequestException('No students to assign seats');
        }

        // 3. Get available seats (not Locked)
        const availableSeats = await this.prisma.examSeat.findMany({
            where: {
                examSessionId,
                status: 'Available',
            },
            orderBy: [{ row: 'asc' }, { col: 'asc' }]
        });

        // 4. Validate enough seats
        if (availableSeats.length < students.length) {
            throw new BadRequestException(
                `Not enough Available seats: ${availableSeats.length} available, ${students.length} students. ` +
                `Unlock ${students.length - availableSeats.length} more seats to proceed.`
            );
        }

        // 5. Select spaced-out seats to maximize distance between students
        // availableSeats is already ordered by row/col from step 3.
        const seatCount = availableSeats.length;
        const studentCount = students.length;
        const step = seatCount / studentCount;

        // Randomize the starting position if there's extra space to keep it unpredictable
        const maxOffset = Math.floor(step);
        const startOffset = maxOffset > 1 ? Math.floor(Math.random() * maxOffset) : 0;

        const selectedSeats = [];
        for (let i = 0; i < studentCount; i++) {
            // Pick seats at regular intervals starting from the offset
            const index = Math.min(Math.floor(i * step) + startOffset, seatCount - 1);
            selectedSeats.push(availableSeats[index]);
        }

        // 6. Shuffle students to ensure a random assignment to these spaced-out seats
        // This ensures integrity while keeping the "spaced" positions
        this.shuffleArray(students);

        // 7. Assign seats in transaction
        await this.prisma.$transaction(async (tx) => {
            for (let i = 0; i < students.length; i++) {
                const student = students[i];
                const seat = selectedSeats[i];

                // Update StudentExam with physical seat
                await tx.studentExam.update({
                    where: { id: student.id },
                    data: { seatPosition: seat.id }
                });

                // Update ExamSeat status to Assigned
                await tx.examSeat.update({
                    where: { id: seat.id },
                    data: { status: 'Assigned' }
                });
            }
        });

        this.logger.log(`Successfully assigned ${students.length} students to seats`);

        return {
            success: true,
            message: `Successfully assigned ${students.length} students to seats`,
            data: {
                studentsAssigned: students.length,
                seatsUsed: students.length,
            }
        };
    }

    private shuffleArray<T>(array: T[]): void {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}
