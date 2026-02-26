import { Injectable, Inject } from '@nestjs/common';
import { IExamSeatRepository } from '@app/exam-seats/domain/repositories/exam-seat.repository.interface';
import { toExamSeatResponse } from '../../shared/exam-seat.response';

@Injectable()
export class GetAllExamSeatsHandler {
  constructor(
    @Inject('EXAM_SEAT_REPOSITORY')
    private readonly examSeatRepository: IExamSeatRepository,
  ) {}

  async execute() {
    const seats = await this.examSeatRepository.findAll();
    return seats.map((seat) => toExamSeatResponse(seat));
  }
}
