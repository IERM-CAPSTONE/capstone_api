import { ExamSeat } from '../entities/exam-seat.entity';

export interface IExamSeatRepository {
    findAll(): Promise<ExamSeat[]>;
    findById(id: string): Promise<ExamSeat | null>;
    findBySession(examSessionId: string, status?: string): Promise<ExamSeat[]>;
    findByCoordinate(examSessionId: string, row: number, col: number): Promise<ExamSeat | null>;
    save(examSeat: ExamSeat): Promise<ExamSeat>;
    saveMany(examSeats: ExamSeat[]): Promise<ExamSeat[]>;
    delete(id: string): Promise<void>;
    countBySessionAndStatus(examSessionId: string, status: string): Promise<number>;
}
