import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IExamSeatRepository } from '@app/exam-seats/domain/repositories/exam-seat.repository.interface';
import { IExamSessionRepository, EXAM_SESSION_REPOSITORY } from '@app/exam-sessions/domain/repositories/exam-session.repository.interface';
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
    const seats = await this.examSeatRepository.findBySession(
      dto.sessionId,
      dto.status,
    );

    return seats.map((seat) => toExamSeatResponse(seat));
  }
}
