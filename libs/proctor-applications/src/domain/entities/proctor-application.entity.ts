/**
 * ProctorApplication Entity - Domain Model
 * Represents a proctor's application for invigilation shifts
 */
export class ProctorApplication {
    private constructor(
        public readonly id: string,
        public readonly teacherId: string,
        public readonly preferredShift: string,
        public readonly preferredType: string,
        public readonly preferredDate: Date | null,
        public readonly notes: string | null,
        public readonly status: string,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
        public readonly teacherName: string | null = null,
        public readonly teacherCode: string | null = null,
    ) { }

    static create(props: {
        id: string;
        teacherId: string;
        preferredShift: string;
        preferredType: string;
        preferredDate?: Date | null;
        notes?: string | null;
        status?: string;
    }): ProctorApplication {
        return new ProctorApplication(
            props.id,
            props.teacherId,
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
        preferredShift: string;
        preferredType: string;
        preferredDate: Date | null;
        notes: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        teacherName?: string | null;
        teacherCode?: string | null;
    }): ProctorApplication {
        return new ProctorApplication(
            props.id,
            props.teacherId,
            props.preferredShift,
            props.preferredType,
            props.preferredDate,
            props.notes,
            props.status,
            props.createdAt,
            props.updatedAt,
            props.teacherName,
            props.teacherCode,
        );
    }

    // Business methods
    canBeEdited(): boolean {
        return this.status === 'PENDING';
    }

    canBeCanceled(): boolean {
        return this.status === 'PENDING' || this.status === 'APPROVED';
    }

    cancel(): ProctorApplication {
        if (!this.canBeCanceled()) {
            throw new Error(`Cannot cancel application with status: ${this.status}`);
        }

        return ProctorApplication.reconstitute({
            id: this.id,
            teacherId: this.teacherId,
            preferredShift: this.preferredShift,
            preferredType: this.preferredType,
            preferredDate: this.preferredDate,
            notes: this.notes,
            status: 'CANCELED',
            createdAt: this.createdAt,
            updatedAt: new Date(),
            teacherName: this.teacherName,
            teacherCode: this.teacherCode,
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
            preferredShift: this.preferredShift,
            preferredType: this.preferredType,
            preferredDate: this.preferredDate,
            notes: this.notes,
            status: newStatus,
            createdAt: this.createdAt,
            updatedAt: new Date(),
            teacherName: this.teacherName,
            teacherCode: this.teacherCode,
        });
    }

    update(props: {
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
            preferredShift: props.preferredShift ?? this.preferredShift,
            preferredType: props.preferredType ?? this.preferredType,
            preferredDate: props.preferredDate !== undefined ? props.preferredDate : this.preferredDate,
            notes: props.notes !== undefined ? props.notes : this.notes,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: new Date(),
            teacherName: this.teacherName,
            teacherCode: this.teacherCode,
        });
    }
}
