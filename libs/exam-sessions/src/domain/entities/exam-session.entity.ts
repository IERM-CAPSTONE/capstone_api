import { SemesterCode } from '../value-objects/semester-code.vo';
import { ExamTime } from '../value-objects/exam-time.vo';

export class ExamSession {
    private constructor(
        public readonly id: string,
        public readonly examRoomId: string | null,
        public readonly proctorId: string | null,
        public readonly hallInvigilatorId: string | null,
        public readonly semesterCode: SemesterCode | null,
        public readonly examTime: ExamTime,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) { }

    static create(props: {
        id: string;
        examRoomId?: string | null;
        proctorId?: string | null;
        hallInvigilatorId?: string | null;
        semesterCode?: string | null;
        examOpenTime?: Date | null;
        examCloseTime?: Date | null;
    }): ExamSession {
        return new ExamSession(
            props.id,
            props.examRoomId ?? null,
            props.proctorId ?? null,
            props.hallInvigilatorId ?? null,
            SemesterCode.create(props.semesterCode),
            ExamTime.create(props.examOpenTime, props.examCloseTime),
            new Date(),
            new Date(),
        );
    }

    static reconstitute(props: {
        id: string;
        examRoomId: string | null;
        proctorId: string | null;
        hallInvigilatorId: string | null;
        semesterCode: string | null;
        examOpenTime: Date | null;
        examCloseTime: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }): ExamSession {
        return new ExamSession(
            props.id,
            props.examRoomId,
            props.proctorId,
            props.hallInvigilatorId,
            SemesterCode.create(props.semesterCode),
            ExamTime.create(props.examOpenTime, props.examCloseTime),
            props.createdAt,
            props.updatedAt,
        );
    }

    update(props: {
        examRoomId?: string | null;
        proctorId?: string | null;
        hallInvigilatorId?: string | null;
        semesterCode?: string | null;
        examOpenTime?: Date | null;
        examCloseTime?: Date | null;
    }): ExamSession {
        return new ExamSession(
            this.id,
            props.examRoomId !== undefined ? props.examRoomId : this.examRoomId,
            props.proctorId !== undefined ? props.proctorId : this.proctorId,
            props.hallInvigilatorId !== undefined ? props.hallInvigilatorId : this.hallInvigilatorId,
            props.semesterCode !== undefined ? SemesterCode.create(props.semesterCode) : this.semesterCode,
            ExamTime.create(
                props.examOpenTime !== undefined ? props.examOpenTime : this.examTime.openTime,
                props.examCloseTime !== undefined ? props.examCloseTime : this.examTime.closeTime
            ),
            this.createdAt,
            new Date(),
        );
    }
}
