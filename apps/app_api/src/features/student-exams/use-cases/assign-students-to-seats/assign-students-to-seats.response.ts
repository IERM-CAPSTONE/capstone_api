import { ApiProperty } from '@nestjs/swagger';

export interface SeatAssignment {
    studentId: string;
    seatId: string;
    row: number;
    column: number;
}

export interface StudentExamAssignment {
    id: string;
    seatNumber: number | null;
    student: {
        id: string;
        fullName: string;
        code: string;
    };
}

export interface ExamRoomInfo {
    id: string;
    roomNumber: string;
    max_rows: number;
    max_columns: number;
    total_seats: number;
}

export class AssignStudentsToSeatsResponse {
    @ApiProperty({ description: 'Number of students successfully assigned' })
    assignedCount: number;

    @ApiProperty({ description: 'Number of assignment failures' })
    failedCount: number;

    @ApiProperty({ description: 'Number of seats still available after assignment' })
    availableSeatsCount: number;

    @ApiProperty({ description: 'List of seat assignments' })
    assignments: SeatAssignment[];

    @ApiProperty({ description: 'Exam session ID' })
    examSessionId: string;

    @ApiProperty({ description: 'Exam room ID' })
    examRoomId: string;

    @ApiProperty({ description: 'Maximum rows in the seat grid' })
    maxRows: number;

    @ApiProperty({ description: 'Maximum columns in the seat grid' })
    maxColumns: number;

    @ApiProperty({ description: 'Total seat count' })
    totalSeats: number;

    @ApiProperty({ description: 'Timestamp of assignment' })
    assignedAt: Date;

    @ApiProperty({ description: 'Complete assigned student exams with student info for seat map rendering' })
    studentExams: StudentExamAssignment[];

    @ApiProperty({ description: 'Exam room details' })
    examRoom: ExamRoomInfo;
}

