import { SubjectCode } from '../value-objects/subject-code.vo';
import { ExamTime } from '../value-objects/exam-time.vo';

export class ExamSession {
    private constructor(
        public readonly id: string,
        public readonly examRoomId: string | null,
        public readonly proctorId: string | null,
        public readonly hallInvigilatorId: string | null,
        public readonly subjectCode: SubjectCode | null,
        public readonly examTime: ExamTime,
        public readonly status: string,
        public readonly examType: string[],
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) { }

    static create(props: {
        id: string;
        examRoomId?: string | null;
        proctorId?: string | null;
        hallInvigilatorId?: string | null;
        subjectCode?: string | null;
        examOpenTime?: Date | null;
        examCloseTime?: Date | null;
        status?: string;
        examType?: string[];
    }): ExamSession {
        return new ExamSession(
            props.id,
            props.examRoomId ?? null,
            props.proctorId ?? null,
            props.hallInvigilatorId ?? null,
            SubjectCode.create(props.subjectCode),
            ExamTime.create(props.examOpenTime, props.examCloseTime),
            props.status ?? 'Scheduled',
            props.examType ?? [],
            new Date(),
            new Date(),
        );
    }

    static reconstitute(props: {
        id: string;
        examRoomId: string | null;
        proctorId: string | null;
        hallInvigilatorId: string | null;
        subjectCode: string | null;
        examOpenTime: Date | null;
        examCloseTime: Date | null;
        status: string;
        examType: string[];
        createdAt: Date;
        updatedAt: Date;
    }): ExamSession {
        return new ExamSession(
            props.id,
            props.examRoomId,
            props.proctorId,
            props.hallInvigilatorId,
            SubjectCode.create(props.subjectCode),
            ExamTime.create(props.examOpenTime, props.examCloseTime),
            props.status,
            props.examType,
            props.createdAt,
            props.updatedAt,
        );
    }

    update(props: {
        examRoomId?: string | null;
        proctorId?: string | null;
        hallInvigilatorId?: string | null;
        subjectCode?: string | null;
        examOpenTime?: Date | null;
        examCloseTime?: Date | null;
        status?: string;
        examType?: string[];
    }): ExamSession {
        return new ExamSession(
            this.id,
            props.examRoomId !== undefined ? props.examRoomId : this.examRoomId,
            props.proctorId !== undefined ? props.proctorId : this.proctorId,
            props.hallInvigilatorId !== undefined ? props.hallInvigilatorId : this.hallInvigilatorId,
            props.subjectCode !== undefined ? SubjectCode.create(props.subjectCode) : this.subjectCode,
            ExamTime.create(
                props.examOpenTime !== undefined ? props.examOpenTime : this.examTime.openTime,
                props.examCloseTime !== undefined ? props.examCloseTime : this.examTime.closeTime
            ),
            props.status !== undefined ? props.status : this.status,
            props.examType !== undefined ? props.examType : this.examType,
            this.createdAt,
            new Date(),
        );
    }
}
