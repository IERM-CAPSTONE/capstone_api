/**
 * ProctorApplication Entity - Domain Model
 * Represents a swap request between two proctors.
 */
export class ProctorApplication {
    private constructor(
        public readonly id: string,
        public readonly teacherId: string,
        public readonly targetTeacherId: string | null,
        public readonly examSessionId: string | null,
        public readonly targetExamSessionId: string | null,
        public readonly preferredShift: string,
        public readonly preferredType: string,
        public readonly preferredDate: Date | null,
        public readonly notes: string | null,
        public readonly status: string,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
        public readonly teacherName: string | null = null,
        public readonly teacherCode: string | null = null,
        public readonly targetTeacherName: string | null = null,
        public readonly targetTeacherCode: string | null = null,
        public readonly roomNumber: string | null = null,
        public readonly examOpenTime: Date | null = null,
        public readonly examCloseTime: Date | null = null,
        public readonly targetRoomNumber: string | null = null,
        public readonly targetExamOpenTime: Date | null = null,
        public readonly targetExamCloseTime: Date | null = null,
    ) { }

    static create(props: {
        id: string;
        teacherId: string;
        targetTeacherId?: string | null;
        examSessionId?: string | null;
        targetExamSessionId?: string | null;
        preferredShift: string;
        preferredType: string;
        preferredDate?: Date | null;
        notes?: string | null;
        status?: string;
    }): ProctorApplication {
        return new ProctorApplication(
            props.id,
            props.teacherId,
            props.targetTeacherId ?? null,
            props.examSessionId ?? null,
            props.targetExamSessionId ?? null,
            props.preferredShift,
            props.preferredType,
            props.preferredDate ?? null,
            props.notes ?? null,
            props.status ?? 'PENDING',
            new Date(),
            new Date(),
        );
    }

    static reconstitute(props: {
        id: string;
        teacherId: string;
        targetTeacherId: string | null;
        examSessionId: string | null;
        targetExamSessionId: string | null;
        preferredShift: string;
        preferredType: string;
        preferredDate: Date | null;
        notes: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        teacherName?: string | null;
        teacherCode?: string | null;
        targetTeacherName?: string | null;
        targetTeacherCode?: string | null;
        roomNumber?: string | null;
        examOpenTime?: Date | null;
        examCloseTime?: Date | null;
        targetRoomNumber?: string | null;
        targetExamOpenTime?: Date | null;
        targetExamCloseTime?: Date | null;
    }): ProctorApplication {
        return new ProctorApplication(
            props.id,
            props.teacherId,
            props.targetTeacherId,
            props.examSessionId,
            props.targetExamSessionId,
            props.preferredShift,
            props.preferredType,
            props.preferredDate,
            props.notes,
            props.status,
            props.createdAt,
            props.updatedAt,
            props.teacherName,
            props.teacherCode,
            props.targetTeacherName,
            props.targetTeacherCode,
            props.roomNumber,
            props.examOpenTime,
            props.examCloseTime,
            props.targetRoomNumber,
            props.targetExamOpenTime,
            props.targetExamCloseTime,
        );
    }

    canBeEdited(): boolean {
        return this.status === 'PENDING';
    }

    canBeCanceled(): boolean {
        return this.status === 'PENDING';
    }

    cancel(): ProctorApplication {
        if (!this.canBeCanceled()) {
            throw new Error(`Cannot cancel application with status: ${this.status}`);
        }

        return ProctorApplication.reconstitute({
            id: this.id,
            teacherId: this.teacherId,
            targetTeacherId: this.targetTeacherId,
            examSessionId: this.examSessionId,
            targetExamSessionId: this.targetExamSessionId,
            preferredShift: this.preferredShift,
            preferredType: this.preferredType,
            preferredDate: this.preferredDate,
            notes: this.notes,
            status: 'CANCELED',
            createdAt: this.createdAt,
            updatedAt: new Date(),
            teacherName: this.teacherName,
            teacherCode: this.teacherCode,
            targetTeacherName: this.targetTeacherName,
            targetTeacherCode: this.targetTeacherCode,
            roomNumber: this.roomNumber,
            examOpenTime: this.examOpenTime,
            examCloseTime: this.examCloseTime,
            targetRoomNumber: this.targetRoomNumber,
            targetExamOpenTime: this.targetExamOpenTime,
            targetExamCloseTime: this.targetExamCloseTime,
        });
    }

    updateStatus(newStatus: string): ProctorApplication {
        const validStatuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELED'];
        if (!validStatuses.includes(newStatus)) {
            throw new Error(`Invalid status: ${newStatus}`);
        }

        return ProctorApplication.reconstitute({
            id: this.id,
            teacherId: this.teacherId,
            targetTeacherId: this.targetTeacherId,
            examSessionId: this.examSessionId,
            targetExamSessionId: this.targetExamSessionId,
            preferredShift: this.preferredShift,
            preferredType: this.preferredType,
            preferredDate: this.preferredDate,
            notes: this.notes,
            status: newStatus,
            createdAt: this.createdAt,
            updatedAt: new Date(),
            teacherName: this.teacherName,
            teacherCode: this.teacherCode,
            targetTeacherName: this.targetTeacherName,
            targetTeacherCode: this.targetTeacherCode,
            roomNumber: this.roomNumber,
            examOpenTime: this.examOpenTime,
            examCloseTime: this.examCloseTime,
            targetRoomNumber: this.targetRoomNumber,
            targetExamOpenTime: this.targetExamOpenTime,
            targetExamCloseTime: this.targetExamCloseTime,
        });
    }

    update(props: {
        targetTeacherId?: string | null;
        examSessionId?: string | null;
        targetExamSessionId?: string | null;
        preferredShift?: string;
        preferredType?: string;
        preferredDate?: Date | null;
        notes?: string | null;
    }): ProctorApplication {
        if (!this.canBeEdited()) {
            throw new Error(`Cannot edit application with status: ${this.status}`);
        }

        return ProctorApplication.reconstitute({
            id: this.id,
            teacherId: this.teacherId,
            targetTeacherId: props.targetTeacherId !== undefined ? props.targetTeacherId : this.targetTeacherId,
            examSessionId: props.examSessionId !== undefined ? props.examSessionId : this.examSessionId,
            targetExamSessionId: props.targetExamSessionId !== undefined ? props.targetExamSessionId : this.targetExamSessionId,
            preferredShift: props.preferredShift ?? this.preferredShift,
            preferredType: props.preferredType ?? this.preferredType,
            preferredDate: props.preferredDate !== undefined ? props.preferredDate : this.preferredDate,
            notes: props.notes !== undefined ? props.notes : this.notes,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: new Date(),
            teacherName: this.teacherName,
            teacherCode: this.teacherCode,
            targetTeacherName: this.targetTeacherName,
            targetTeacherCode: this.targetTeacherCode,
            roomNumber: this.roomNumber,
            examOpenTime: this.examOpenTime,
            examCloseTime: this.examCloseTime,
            targetRoomNumber: this.targetRoomNumber,
            targetExamOpenTime: this.targetExamOpenTime,
            targetExamCloseTime: this.targetExamCloseTime,
        });
    }
}
