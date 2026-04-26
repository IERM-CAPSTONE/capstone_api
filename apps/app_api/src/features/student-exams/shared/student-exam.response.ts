import { ApiProperty } from '@nestjs/swagger';

type StudentMeta = {
    fullName?: string | null;
    code?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
};

type StudentExamWithMeta = {
    id: string;
    examSessionId: string;
    studentId: string;
    seatNumber: string | null;
    seatPosition: string | null;
    createdAt: Date;
    updatedAt: Date;
    studentName: string | null;
    studentCode: string | null;
    stt: number | null;
    studentEmail: string | null;
    studentAvatarUrl?: string | null;
    student?: StudentMeta | null;
    hasFaceRegistered?: boolean | null;
    parts: any[];
};

export class StudentExamResponse {
    @ApiProperty()
    id: string;

    @ApiProperty()
    examSessionId: string;

    @ApiProperty()
    studentId: string;

    @ApiProperty({ nullable: true })
    seatNumber: string | null;

    @ApiProperty({ nullable: true })
    seatPosition: string | null;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;

    @ApiProperty({ nullable: true })
    studentName: string | null;

    @ApiProperty({ nullable: true })
    studentCode: string | null;

    @ApiProperty({ nullable: true })
    stt: number | null;

    @ApiProperty({ nullable: true })
    studentEmail: string | null;

    @ApiProperty({ nullable: true })
    studentAvatarUrl: string | null;

    @ApiProperty({
        description: 'Whether the assigned student has registered face identity',
        type: Boolean,
    })
    hasFaceRegistered: boolean;

    @ApiProperty({
        description: 'Attendance/submission status per exam part',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                id: { type: 'string' },
                examPartId: { type: 'string', nullable: true },
                examPartCode: { type: 'string', nullable: true },
                examPartName: { type: 'string', nullable: true },
                isCheckedIn: { type: 'boolean' },
                checkInTime: { type: 'string', nullable: true },
                isSubmit: { type: 'boolean' },
                submitTime: { type: 'string', nullable: true },
                isSign: { type: 'boolean' },
                signTime: { type: 'string', nullable: true },
            }
        }
    })
    parts: any[];
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

export function toStudentExamResponse(
    studentExam: StudentExamWithMeta,
): StudentExamResponse {
    return {
        id: studentExam.id,
        examSessionId: studentExam.examSessionId,
        studentId: studentExam.studentId,
        seatNumber: studentExam.seatNumber,
        seatPosition: studentExam.seatPosition ?? null,
        createdAt: studentExam.createdAt,
        updatedAt: studentExam.updatedAt,
        studentName: studentExam.studentName ?? studentExam.student?.fullName ?? null,
        studentCode: studentExam.studentCode ?? studentExam.student?.code ?? null,
        studentEmail: studentExam.studentEmail ?? studentExam.student?.email ?? null,
        studentAvatarUrl:
            studentExam.studentAvatarUrl ?? studentExam.student?.avatarUrl ?? null,
        hasFaceRegistered: studentExam.hasFaceRegistered === true,
        stt: studentExam.stt,
        parts: (studentExam.parts || []).map((p: any) => ({
            id: p.id,
            examPartId: p.examPartId,
            examPartCode: p.examPart?.code ?? null,
            examPartName: p.examPart?.name ?? null,
            isCheckedIn: p.isCheckedIn,
            checkInTime: p.checkInTime,
            isSubmit: p.isSubmit,
            submitTime: p.submitTime,
            isSign: p.isSign,
            signTime: p.signTime,
        })),
    };
}
