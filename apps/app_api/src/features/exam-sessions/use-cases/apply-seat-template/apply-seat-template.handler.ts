import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { ApplySeatTemplateDto, SeatTemplateType } from './apply-seat-template.dto';

@Injectable()
export class ApplySeatTemplateHandler {
    constructor(private readonly prisma: PrismaService) { }

    async handle(examSessionId: string, dto: ApplySeatTemplateDto) {
        const session = await this.prisma.examSession.findUnique({
            where: { id: examSessionId },
            include: { examRoom: true },
        });

        if (!session) {
            throw new BadRequestException('Exam session not found');
        }

        if (session.hasStudentsImported) {
            throw new BadRequestException('Cannot apply seat template after students are assigned to seats');
        }

        const seats = await this.prisma.examSeat.findMany({
            where: { examSessionId },
            orderBy: [{ row: 'asc' }, { col: 'asc' }],
        });

        if (seats.length === 0) {
            throw new BadRequestException('No seats found for this session');
        }

        const assignedCount = seats.filter((s) => ['Assigned', 'Present', 'Absent'].includes(s.status)).length;
        if (assignedCount > 0) {
            throw new BadRequestException('Cannot apply template when students are already assigned');
        }

        const maxRow = Math.max(...seats.map((s) => s.row));
        const maxCol = Math.max(...seats.map((s) => s.col));
        const templateCoordinates = this.buildTemplateCoordinates(dto.templateType, maxRow, maxCol, dto.gap ?? 2);

        await this.prisma.$transaction(async (tx) => {
            for (const seat of seats) {
                const key = `${seat.row}-${seat.col}`;
                // Seats in the template pattern are AVAILABLE, everything else is LOCKED
                const nextStatus = templateCoordinates.has(key) ? 'Available' : 'Locked';

                if (seat.status !== nextStatus) {
                    await tx.examSeat.update({
                        where: { id: seat.id },
                        data: { status: nextStatus as any },
                    });
                }
            }
        });

        const availableCount = seats.filter((s) => templateCoordinates.has(`${s.row}-${s.col}`)).length;
        const lockedCount = seats.length - availableCount;

        return {
            success: true,
            message: `Applied ${dto.templateType} template successfully`,
            data: {
                templateType: dto.templateType,
                seatsUpdated: seats.length,
                availableSeats: availableCount,
                lockedSeats: lockedCount,
            },
        };
    }

    private buildTemplateCoordinates(
        templateType: SeatTemplateType,
        rows: number,
        cols: number,
        gap: number,
    ): Set<string> {
        // Returns the set of coordinates that form the AVAILABLE seating area
        const available = new Set<string>();
        const add = (row: number, col: number) => available.add(`${row}-${col}`);

        for (let row = 1; row <= rows; row++) {
            for (let col = 1; col <= cols; col++) {
                const isTop = row === 1;
                const isBottom = row === rows;
                const isLeft = col === 1;
                const isRight = col === cols;

                switch (templateType) {
                    case SeatTemplateType.U_SHAPE:
                        // U-shape: perimeter bottom, left, right are available; center locked
                        if (isBottom || isLeft || isRight) add(row, col);
                        break;
                    case SeatTemplateType.L_LEFT:
                        // L-Left: left edge and bottom row available
                        if (isLeft || isBottom) add(row, col);
                        break;
                    case SeatTemplateType.L_RIGHT:
                        // L-Right: right edge and bottom row available
                        if (isRight || isBottom) add(row, col);
                        break;
                    case SeatTemplateType.O_SHAPE:
                        // O-shape: only perimeter available (all edges), center locked
                        if (isTop || isBottom || isLeft || isRight) add(row, col);
                        break;
                    case SeatTemplateType.GAP_PATTERN:
                        // Gap pattern: gap intervals are locked, rest available
                        if (((row + col) % gap) !== 0) add(row, col);
                        break;
                    case SeatTemplateType.ALTERNATE_ROWS:
                        // Alternate rows: odd rows available, even rows locked
                        if (row % 2 === 1) add(row, col);
                        break;
                    default:
                        break;
                }
            }
        }

        return available;
    }
}
