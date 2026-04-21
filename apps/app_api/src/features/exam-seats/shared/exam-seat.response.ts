import { ExamSeat, ExamSeatStatusType } from '@app/exam-seats';

export interface ExamSeatResponse {
    id: string;
    examSessionId: string;
    row: number;
    col: number;
    status: ExamSeatStatusType;
    createdAt: Date;
    updatedAt: Date;
}

export function toExamSeatResponse(examSeat: ExamSeat): ExamSeatResponse {
    return {
        id: examSeat.id,
        examSessionId: examSeat.examSessionId,
        row: examSeat.row,
        col: examSeat.col,
        status: examSeat.status,
        createdAt: examSeat.createdAt,
        updatedAt: examSeat.updatedAt,
    };
}
