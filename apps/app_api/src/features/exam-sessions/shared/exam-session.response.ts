import { ApiProperty } from '@nestjs/swagger';
import { ExamSession } from '@app/exam-sessions';

export class ExamSessionResponse {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @ApiProperty({ nullable: true })
    examRoomId: string | null;

    @ApiProperty({ nullable: true })
    proctorId: string | null;

    @ApiProperty({ nullable: true })
    hallInvigilatorId: string | null;

    @ApiProperty({ nullable: true })
    subjectCode: string | null;

    @ApiProperty({ nullable: true })
    examCode: string | null;

    @ApiProperty({ nullable: true })
    openCode: string | null;

    @ApiProperty({ nullable: true })
    examOpenTime: Date | null;

    @ApiProperty({ nullable: true })
    examCloseTime: Date | null;

    @ApiProperty({ example: 'Scheduled', enum: ['Ongoing', 'Ended', 'Scheduled'], description: 'Session status' })
    status: string;

    @ApiProperty({ example: ['L', 'R'] })
    examType: string[];

    @ApiProperty({ nullable: true })
    semesterId: string | null;

    @ApiProperty({ nullable: true })
    note: string | null;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty({ nullable: true })
    roomNumber: string | null;

    @ApiProperty({ nullable: true })
    proctorName: string | null;

    @ApiProperty({ nullable: true })
    hallInvigilatorName: string | null;

    @ApiProperty({ nullable: true })
    maxRows: number | null;

    @ApiProperty({ nullable: true })
    maxColumns: number | null;

    @ApiProperty({ nullable: true })
    totalSeats: number | null;

    @ApiProperty({ description: 'Archive flag', default: false })
    isArchived: boolean;
}

export function toExamSessionResponse(session: ExamSession): ExamSessionResponse {
    return {
        id: session.id,
        examRoomId: session.examRoomId,
        proctorId: session.proctorId,
        hallInvigilatorId: session.hallInvigilatorId,
        subjectCode: session.subjectCode?.value ?? null,
        examCode: session.examCode,
        openCode: session.openCode,
        examOpenTime: session.examTime.openTime,
        examCloseTime: session.examTime.closeTime,
        status: session.status,
        examType: session.examType,
        semesterId: session.semesterId,
        note: session.note,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        roomNumber: session.roomNumber,
        proctorName: session.proctorName,
        hallInvigilatorName: session.hallInvigilatorName,
        maxRows: session.maxRows,
        maxColumns: session.maxColumns,
        totalSeats: session.totalSeats,
        isArchived: session.isArchived ?? false,
    };
}

export class PaginatedExamSessionResponse {
    @ApiProperty({ type: [ExamSessionResponse] })
    data: ExamSessionResponse[];

    @ApiProperty()
    total: number;

    @ApiProperty()
    page: number;

    @ApiProperty()
    limit: number;

    @ApiProperty()
    totalPages: number;
}
