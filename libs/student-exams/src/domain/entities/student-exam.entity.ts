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
        public readonly status: string,
        public readonly currentLocation: string | null,
        public readonly identityId: string | null,
        public readonly isMatched: boolean,
        public readonly checkinTime: Date | null,
        public readonly checkoutTime: Date | null,
        public readonly isValid: boolean,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
        public readonly studentName: string | null = null,
        public readonly studentCode: string | null = null,
    ) { }

    static create(props: {
        id: string;
        examSessionId: string;
        studentId: string;
        seatNumber?: string | null;
        seatPosition?: string | null;
        status?: string;
        currentLocation?: string | null;
        identityId?: string | null;
        isMatched?: boolean;
        checkinTime?: Date | null;
        checkoutTime?: Date | null;
        isValid?: boolean;
    }): StudentExam {
        return new StudentExam(
            props.id,
            props.examSessionId,
            props.studentId,
            props.seatNumber ?? null,
            props.seatPosition ?? null,
            props.status ?? 'REGISTERED',
            props.currentLocation ?? null,
            props.identityId ?? null,
            props.isMatched ?? false,
            props.checkinTime ?? null,
            props.checkoutTime ?? null,
            props.isValid ?? true,
            new Date(),
            new Date(),
        );
    }

    static reconstitute(props: {
        id: string;
        examSessionId: string;
        studentId: string;
        seatNumber: string | null;
        seatPosition: string | null;
        status: string;
        currentLocation: string | null;
        identityId: string | null;
        isMatched: boolean;
        checkinTime: Date | null;
        checkoutTime: Date | null;
        isValid: boolean;
        createdAt: Date;
        updatedAt: Date;
        studentName?: string | null;
        studentCode?: string | null;
    }): StudentExam {
        return new StudentExam(
            props.id,
            props.examSessionId,
            props.studentId,
            props.seatNumber,
            props.seatPosition,
            props.status,
            props.currentLocation,
            props.identityId,
            props.isMatched,
            props.checkinTime,
            props.checkoutTime,
            props.isValid,
            props.createdAt,
            props.updatedAt,
            props.studentName,
            props.studentCode,
        );
    }

    update(props: {
        seatNumber?: string | null;
        seatPosition?: string | null;
        status?: string;
        currentLocation?: string | null;
        identityId?: string | null;
        isMatched?: boolean;
        checkinTime?: Date | null;
        checkoutTime?: Date | null;
        isValid?: boolean;
    }): StudentExam {
        return new StudentExam(
            this.id,
            this.examSessionId,
            this.studentId,
            props.seatNumber !== undefined ? props.seatNumber : this.seatNumber,
            props.seatPosition !== undefined ? props.seatPosition : this.seatPosition,
            props.status !== undefined ? props.status : this.status,
            props.currentLocation !== undefined ? props.currentLocation : this.currentLocation,
            props.identityId !== undefined ? props.identityId : this.identityId,
            props.isMatched !== undefined ? props.isMatched : this.isMatched,
            props.checkinTime !== undefined ? props.checkinTime : this.checkinTime,
            props.checkoutTime !== undefined ? props.checkoutTime : this.checkoutTime,
            props.isValid !== undefined ? props.isValid : this.isValid,
            this.createdAt,
            new Date(),
            this.studentName,
            this.studentCode,
        );
    }
}
