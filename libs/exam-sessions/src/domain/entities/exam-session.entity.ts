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
        public readonly examCode: string | null,
        public readonly openCode: string | null,
        public readonly status: string,
        public readonly examType: string[],
        public readonly semesterId: string | null,
        public readonly note: string | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
        // Display names (populated by repository if needed)
        public readonly roomNumber: string | null = null,
        public readonly proctorName: string | null = null,
        public readonly hallInvigilatorName: string | null = null,
        public readonly maxRows: number | null = null,
        public readonly maxColumns: number | null = null,
        public readonly totalSeats: number | null = null,
        public readonly isArchived: boolean = false,
        public readonly hasStudentsImported: boolean = false,
    ) { }

    static create(props: {
        id: string;
        examRoomId?: string | null;
        proctorId?: string | null;
        hallInvigilatorId?: string | null;
        subjectCode?: string | null;
        examOpenTime?: Date | null;
        examCloseTime?: Date | null;
        examCode?: string | null;
        openCode?: string | null;
        status?: string;
        examType?: string[];
        semesterId?: string | null;
        note?: string | null;
        isArchived?: boolean;
        hasStudentsImported?: boolean;
    }): ExamSession {
        return new ExamSession(
            props.id,
            props.examRoomId ?? null,
            props.proctorId ?? null,
            props.hallInvigilatorId ?? null,
            SubjectCode.create(props.subjectCode),
            ExamTime.create(props.examOpenTime, props.examCloseTime),
            props.examCode ?? null,
            props.openCode ?? null,
            props.status ?? 'Scheduled',
            props.examType ?? [],
            props.semesterId ?? null,
            props.note ?? null,
            new Date(),
            new Date(),
            null,
            null,
            null,
            null,
            null,
            null,
            props.isArchived ?? false,
            props.hasStudentsImported ?? false,
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
        examCode: string | null;
        openCode: string | null;
        status: string;
        examType: string[];
        semesterId: string | null;
        note: string | null;
        createdAt: Date;
        updatedAt: Date;
        roomNumber?: string | null;
        proctorName?: string | null;
        hallInvigilatorName?: string | null;
        maxRows?: number | null;
        maxColumns?: number | null;
        totalSeats?: number | null;
        isArchived?: boolean;
        hasStudentsImported?: boolean;
    }): ExamSession {
        return new ExamSession(
            props.id,
            props.examRoomId,
            props.proctorId,
            props.hallInvigilatorId,
            SubjectCode.create(props.subjectCode),
            ExamTime.create(props.examOpenTime, props.examCloseTime),
            props.examCode,
            props.openCode,
            props.status,
            props.examType,
            props.semesterId,
            props.note,
            props.createdAt,
            props.updatedAt,
            props.roomNumber,
            props.proctorName,
            props.hallInvigilatorName,
            props.maxRows,
            props.maxColumns,
            props.totalSeats,
            props.isArchived ?? false,
            props.hasStudentsImported ?? false,
        );
    }

    static mapFromPrisma(found: any): ExamSession {
        return ExamSession.reconstitute({
            id: found.id,
            subjectCode: found.subjectCode,
            examRoomId: found.examRoomId,
            proctorId: found.proctorId,
            hallInvigilatorId: found.hallInvigilatorId,
            examOpenTime: found.examOpenTime,
            examCloseTime: found.examCloseTime,
            examCode: found.examCode,
            openCode: found.openCode,
            status: found.status,
            examType: found.examType as string[],
            semesterId: found.semesterId,
            note: found.note,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
            roomNumber: found.examRoom?.roomNumber,
            proctorName: found.proctor?.fullName,
            hallInvigilatorName: found.hallInvigilator?.fullName,
            maxRows: found.examRoom?.max_rows,
            maxColumns: found.examRoom?.max_columns,
            totalSeats: found.examRoom?.total_seats,
            isArchived: found.isArchived ?? false,
            hasStudentsImported: found.hasStudentsImported ?? false,
        });
    }

    update(props: {
        examRoomId?: string | null;
        proctorId?: string | null;
        hallInvigilatorId?: string | null;
        subjectCode?: string | null;
        examOpenTime?: Date | null;
        examCloseTime?: Date | null;
        examCode?: string | null;
        openCode?: string | null;
        status?: string;
        examType?: string[];
        semesterId?: string | null;
        note?: string | null;
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
            props.examCode !== undefined ? props.examCode : this.examCode,
            props.openCode !== undefined ? props.openCode : this.openCode,
            props.status !== undefined ? props.status : this.status,
            props.examType !== undefined ? props.examType : this.examType,
            props.semesterId !== undefined ? props.semesterId : this.semesterId,
            props.note !== undefined ? props.note : this.note,
            this.createdAt,
            new Date(),
            this.roomNumber,
            this.proctorName,
            this.hallInvigilatorName,
            this.maxRows,
            this.maxColumns,
            this.totalSeats,
        );
    }
}
