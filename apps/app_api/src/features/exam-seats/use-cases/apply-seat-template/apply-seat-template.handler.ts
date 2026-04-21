import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { ApplySeatTemplateDto, SeatTemplateMode } from './apply-seat-template.dto';

@Injectable()
export class ApplySeatTemplateHandler {
  private readonly logger = new Logger(ApplySeatTemplateHandler.name);

  constructor(private readonly prisma: PrismaService) {}

  async execute(examSessionId: string, dto: ApplySeatTemplateDto) {
    const session = await this.prisma.examSession.findUnique({
      where: { id: examSessionId },
      include: {
        examSeats: {
          orderBy: [{ row: 'asc' }, { col: 'asc' }],
        },
      },
    });

    if (!session) {
      throw new BadRequestException(`Exam session ${examSessionId} not found`);
    }

    const seats = session.examSeats;
    if (seats.length === 0) {
      throw new BadRequestException('No seats found for this exam session');
    }

    const mutableStatuses = new Set(['Available', 'Locked']);
    const mutableSeats = seats.filter((seat) => mutableStatuses.has(seat.status));

    const lockedKeys = this.resolveLockedCoordinates(dto, seats);

    let updatedCount = 0;
    let skippedCount = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const seat of seats) {
        if (!mutableStatuses.has(seat.status)) {
          skippedCount++;
          continue;
        }

        const key = `${seat.row}_${seat.col}`;
        const nextStatus = lockedKeys.has(key) ? 'Locked' : 'Available';
        if (seat.status === nextStatus) {
          continue;
        }

        await tx.examSeat.update({
          where: { id: seat.id },
          data: { status: nextStatus as any },
        });
        updatedCount++;
      }
    });

    this.logger.log(
      `Applied template ${dto.mode} for session ${examSessionId}. Updated ${updatedCount} seat(s), skipped ${skippedCount} protected seat(s).`,
    );

    return {
      success: true,
      message: `Template ${dto.mode} applied successfully`,
      data: {
        examSessionId,
        mode: dto.mode,
        totalSeats: seats.length,
        mutableSeats: mutableSeats.length,
        updatedSeats: updatedCount,
        skippedSeats: skippedCount,
        lockedSeatsInTemplate: lockedKeys.size,
      },
    };
  }

  private resolveLockedCoordinates(
    dto: ApplySeatTemplateDto,
    seats: Array<{ row: number; col: number }>,
  ): Set<string> {
    if (dto.mode === SeatTemplateMode.RESET) {
      return new Set<string>();
    }

    if (dto.mode === SeatTemplateMode.CHECKERBOARD) {
      return new Set(
        seats
          .filter((seat) => (seat.row + seat.col) % 2 === 0)
          .map((seat) => `${seat.row}_${seat.col}`),
      );
    }

    if (!dto.lockedCoordinates || dto.lockedCoordinates.length === 0) {
      throw new BadRequestException('lockedCoordinates is required for MANUAL mode');
    }

    const existing = new Set(seats.map((seat) => `${seat.row}_${seat.col}`));
    const selected = new Set<string>();

    for (const coord of dto.lockedCoordinates) {
      const key = `${coord.row}_${coord.col}`;
      if (!existing.has(key)) {
        throw new BadRequestException(`Seat coordinate does not exist in session: (${coord.row}, ${coord.col})`);
      }
      selected.add(key);
    }

    return selected;
  }
}
