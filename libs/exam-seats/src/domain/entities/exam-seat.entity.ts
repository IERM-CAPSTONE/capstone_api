export type ExamSeatStatusType = 'Available' | 'Locked' | 'Assigned' | 'Present' | 'Absent';

export interface IExamSeatCreateProps {
    id: string;
    examSessionId: string;
    row: number;
    col: number;
    status: ExamSeatStatusType;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IExamSeatReconstitute extends IExamSeatCreateProps { }

export class ExamSeat {
    readonly id: string;
    readonly examSessionId: string;
    readonly row: number;
    readonly col: number;
    readonly status: ExamSeatStatusType;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    private constructor(props: Required<IExamSeatCreateProps>) {
        this.id = props.id;
        this.examSessionId = props.examSessionId;
        this.row = props.row;
        this.col = props.col;
        this.status = props.status;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
    }

    static create(props: IExamSeatCreateProps): ExamSeat {
        const now = new Date();
        return new ExamSeat({
            ...props,
            createdAt: props.createdAt || now,
            updatedAt: props.updatedAt || now,
        });
    }

    static reconstitute(props: IExamSeatReconstitute): ExamSeat {
        return new ExamSeat({
            ...props,
            createdAt: props.createdAt || new Date(),
            updatedAt: props.updatedAt || new Date(),
        });
    }

    updateStatus(newStatus: ExamSeatStatusType): ExamSeat {
        return ExamSeat.reconstitute({
            id: this.id,
            examSessionId: this.examSessionId,
            row: this.row,
            col: this.col,
            status: newStatus,
            createdAt: this.createdAt,
            updatedAt: new Date(),
        });
    }

    getSeatCoordinate(): string {
        return `(${this.row},${this.col})`;
    }
}
