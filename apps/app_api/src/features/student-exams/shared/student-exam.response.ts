import { ApiProperty } from '@nestjs/swagger';

export class StudentExamResponse {
    @ApiProperty()
    id: string;

    @ApiProperty()
    examSessionId: string;

    @ApiProperty()
    studentId: string;

    @ApiProperty({ nullable: true })
    seatNumber: string | null;

    @ApiProperty()
    status: string;

    @ApiProperty({ nullable: true })
    currentLocation: string | null;

    @ApiProperty({ nullable: true })
    identityId: string | null;

    @ApiProperty()
    isMatched: boolean;

    @ApiProperty({ nullable: true })
    checkinTime: Date | null;

    @ApiProperty({ nullable: true })
    checkoutTime: Date | null;

    @ApiProperty()
    isValid: boolean;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty({ nullable: true })
    studentName: string | null;

    @ApiProperty({ nullable: true })
    studentCode: string | null;

    @ApiProperty({ nullable: true })
    studentAvatarUrl: string | null;

    @ApiProperty({ nullable: true })
    citizenId: string | null;
}

export class PaginatedStudentExamResponse {
    @ApiProperty({ type: [StudentExamResponse] })
    data: StudentExamResponse[];

    @ApiProperty()
    total: number;

    @ApiProperty()
    page: number;

    @ApiProperty()
    limit: number;

    @ApiProperty()
    totalPages: number;
}

export function toStudentExamResponse(studentExam: any): StudentExamResponse {
    return {
        id: studentExam.id,
        examSessionId: studentExam.examSessionId,
        studentId: studentExam.studentId,
        seatNumber: studentExam.seatNumber,
        status: studentExam.status,
        currentLocation: studentExam.currentLocation,
        identityId: studentExam.identityId,
        isMatched: studentExam.isMatched,
        checkinTime: studentExam.checkinTime,
        checkoutTime: studentExam.checkoutTime,
        isValid: studentExam.isValid,
        createdAt: studentExam.createdAt,
        updatedAt: studentExam.updatedAt,
        studentName: studentExam.studentName,
        studentCode: studentExam.studentCode,
        studentAvatarUrl: studentExam.studentAvatarUrl,
        citizenId: studentExam.citizenId,
    };
}
