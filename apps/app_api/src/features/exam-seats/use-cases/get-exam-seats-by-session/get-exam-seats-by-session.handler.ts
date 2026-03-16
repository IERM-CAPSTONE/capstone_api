import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IExamSeatRepository } from '@app/exam-seats/domain/repositories/exam-seat.repository.interface';
import { IExamSessionRepository, EXAM_SESSION_REPOSITORY } from '@app/exam-sessions/domain/repositories/exam-session.repository.interface';
import { ExamSeat } from '@app/exam-seats';
import { v4 as uuidv4 } from 'uuid';
import { GetExamSeatsBySessionDto } from './get-exam-seats-by-session.dto';
import { toExamSeatResponse } from '../../shared/exam-seat.response';

@Injectable()
export class GetExamSeatsBySessionHandler {
  constructor(
    @Inject('EXAM_SEAT_REPOSITORY')
    private readonly examSeatRepository: IExamSeatRepository,
    @Inject(EXAM_SESSION_REPOSITORY)
    private readonly examSessionRepository: IExamSessionRepository,
  ) {}

  async execute(dto: GetExamSeatsBySessionDto) {
    // Verify exam session exists
    const session = await this.examSessionRepository.findById(dto.sessionId);
    if (!session) {
      throw new NotFoundException(
        `Exam session with ID ${dto.sessionId} not found`,
      );
    }

    // Fetch seats with optional status filter
    let seats = await this.examSeatRepository.findBySession(
      dto.sessionId,
      dto.status,
    );

    // Auto-heal legacy sessions that have no seats yet
    if (seats.length === 0) {
      const maxRows = session.maxRows ?? 6;
      const maxColumns = session.maxColumns ?? 3;
      const maxGridSeats = maxRows * maxColumns;
      const totalSeats = session.totalSeats ?? maxGridSeats;
      const seatsToGenerate = Math.max(1, Math.min(totalSeats, maxGridSeats));

      const toCreate: ExamSeat[] = [];
      let generated = 0;

      for (let row = 1; row <= maxRows && generated < seatsToGenerate; row++) {
        for (let col = 1; col <= maxColumns && generated < seatsToGenerate; col++) {
          toCreate.push(
            ExamSeat.create({
              id: uuidv4(),
              examSessionId: dto.sessionId,
              row,
              col,
              status: 'Available',
            }),
          );
          generated++;
        }
      }

      if (toCreate.length > 0) {
        await this.examSeatRepository.saveMany(toCreate);
        seats = await this.examSeatRepository.findBySession(dto.sessionId, dto.status);
      }
    }

    return seats.map((seat) => toExamSeatResponse(seat));
  }
}
