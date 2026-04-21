/**
 * StudentExam Entity - Domain Model
 * Represents a student's registration and attendance for an exam session
 */
export class StudentExam {
    private constructor(
        public readonly id: string,
        public readonly examSessionId: string,
        public readonly studentId: string,
        public readonly seatNumber: string | null,
        public readonly seatPosition: string | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
        public readonly stt: number | null = null,
        public readonly studentName: string | null = null,
        public readonly studentCode: string | null = null,
        public readonly studentEmail: string | null = null,
        public readonly parts: any[] = [],
    ) { }

    static create(props: {
        id: string;
        examSessionId: string;
        studentId: string;
        seatNumber?: string | null;
        seatPosition?: string | null;
        stt?: number | null;
    }): StudentExam {
        return new StudentExam(
            props.id,
            props.examSessionId,
            props.studentId,
            props.seatNumber ?? null,
            props.seatPosition ?? null,
            new Date(),
            new Date(),
            props.stt ?? null,
        );
    }

    static reconstitute(props: {
        id: string;
        examSessionId: string;
        studentId: string;
        seatNumber: string | null;
        seatPosition: string | null;
        createdAt: Date;
        updatedAt: Date;
        stt?: number | null;
        studentName?: string | null;
        studentCode?: string | null;
        studentEmail?: string | null;
        parts?: any[];
    }): StudentExam {
        return new StudentExam(
            props.id,
            props.examSessionId,
            props.studentId,
            props.seatNumber,
            props.seatPosition,
            props.createdAt,
            props.updatedAt,
            props.stt ?? null,
            props.studentName,
            props.studentCode,
            props.studentEmail,
            props.parts ?? [],
        );
    }

    update(props: {
        seatNumber?: string | null;
        seatPosition?: string | null;
        stt?: number | null;
    }): StudentExam {
        return new StudentExam(
            this.id,
            this.examSessionId,
            this.studentId,
            props.seatNumber !== undefined ? props.seatNumber : this.seatNumber,
            props.seatPosition !== undefined ? props.seatPosition : this.seatPosition,
            this.createdAt,
            new Date(),
            props.stt !== undefined ? props.stt : this.stt,
            this.studentName,
            this.studentCode,
        );
    }
}
