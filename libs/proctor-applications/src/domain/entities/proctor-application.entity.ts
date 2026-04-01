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
        public readonly preferredDate: string | null,
        public readonly preferredDates: Date[],
        public readonly notes: string | null,
        public readonly status: string,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
        public readonly teacherName: string | null = null,
        public readonly teacherCode: string | null = null,
    ) { }

    private static normalizePreferredDates(dates: Date[]): Date[] {
        const uniqueByDay = new Map<string, Date>();

        for (const date of dates) {
            if (!date || Number.isNaN(date.getTime())) {
                continue;
            }
            const dayKey = date.toISOString().split('T')[0];
            if (!uniqueByDay.has(dayKey)) {
                uniqueByDay.set(dayKey, date);
            }
        }

        return Array.from(uniqueByDay.values()).sort((a, b) => a.getTime() - b.getTime());
    }

    private static serializePreferredDates(dates: Date[]): string | null {
        if (dates.length === 0) return null;
        const iso = dates.map(d => d.toISOString().split('T')[0]);
        return JSON.stringify(iso);
    }

    private static deserializePreferredDates(json: string | null): Date[] {
        if (!json) return [];
        try {
            const iso: string[] = JSON.parse(json);
            return iso.map(str => new Date(str + 'T00:00:00Z'));
        } catch {
            return [];
        }
    }

    static create(props: {
        id: string;
        teacherId: string;
        preferredShift: string;
        preferredType: string;
        preferredDates?: Date[];
        notes?: string | null;
        status?: string;
    }): ProctorApplication {
        const normalizedDates = ProctorApplication.normalizePreferredDates(props.preferredDates ?? []);
        const serializedDates = ProctorApplication.serializePreferredDates(normalizedDates);

        return new ProctorApplication(
            props.id,
            props.teacherId,
            props.preferredShift,
            props.preferredType,
            serializedDates,
            normalizedDates,
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
        preferredDate: string | null;
        preferredDates?: Date[];
        notes: string | null;
        status: string;
        createdAt: Date;
        updatedAt: Date;
        teacherName?: string | null;
        teacherCode?: string | null;
    }): ProctorApplication {
        const deserializedDates = ProctorApplication.deserializePreferredDates(props.preferredDate);
        const normalizedDates = ProctorApplication.normalizePreferredDates(
            props.preferredDates ?? deserializedDates,
        );

        return new ProctorApplication(
            props.id,
            props.teacherId,
            props.preferredShift,
            props.preferredType,
            props.preferredDate,
            normalizedDates,
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
            preferredDates: this.preferredDates,
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
            preferredDates: this.preferredDates,
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
        preferredDates?: Date[];
        notes?: string | null;
    }): ProctorApplication {
        if (!this.canBeEdited()) {
            throw new Error(`Cannot edit application with status: ${this.status}`);
        }

        const nextPreferredDates = props.preferredDates !== undefined
            ? ProctorApplication.normalizePreferredDates(props.preferredDates)
            : this.preferredDates;

        const nextSerialized = ProctorApplication.serializePreferredDates(nextPreferredDates);

        return ProctorApplication.reconstitute({
            id: this.id,
            teacherId: this.teacherId,
            preferredShift: props.preferredShift ?? this.preferredShift,
            preferredType: props.preferredType ?? this.preferredType,
            preferredDate: nextSerialized,
            preferredDates: nextPreferredDates,
            notes: props.notes !== undefined ? props.notes : this.notes,
            status: this.status,
            createdAt: this.createdAt,
            updatedAt: new Date(),
            teacherName: this.teacherName,
            teacherCode: this.teacherCode,
        });
    }
}
