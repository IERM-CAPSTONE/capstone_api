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
    examOpenTime: Date | null;

    @ApiProperty({ nullable: true })
    examCloseTime: Date | null;

    @ApiProperty({ example: 'Scheduled', enum: ['Ongoing', 'Ended', 'Scheduled'], description: 'Session status' })
    status: string;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

export function toExamSessionResponse(session: ExamSession): ExamSessionResponse {
    return {
        id: session.id,
        examRoomId: session.examRoomId,
        proctorId: session.proctorId,
        hallInvigilatorId: session.hallInvigilatorId,
        subjectCode: session.subjectCode?.value ?? null,
        examOpenTime: session.examTime.openTime,
        examCloseTime: session.examTime.closeTime,
        status: session.status,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
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
