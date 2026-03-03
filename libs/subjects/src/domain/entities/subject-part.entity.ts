/**
 * SubjectPart Entity
 */
export class SubjectPart {
    private constructor(
        public readonly id: string,
        public readonly subjectId: string,
        public readonly examTypeId: string,
        public readonly duration: number | null,
        public readonly examType: any | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) { }

    static create(props: {
        id: string;
        subjectId: string;
        examTypeId: string;
        duration?: number | null;
        examType?: any | null;
    }): SubjectPart {
        return new SubjectPart(
            props.id,
            props.subjectId,
            props.examTypeId,
            props.duration ?? null,
            props.examType ?? null,
            new Date(),
            new Date(),
        );
    }

    static reconstitute(props: {
        id: string;
        subjectId: string;
        examTypeId: string;
        duration: number | null;
        examType: any | null;
        createdAt: Date;
        updatedAt: Date;
    }): SubjectPart {
        return new SubjectPart(
            props.id,
            props.subjectId,
            props.examTypeId,
            props.duration,
            props.examType,
            props.createdAt,
            props.updatedAt,
        );
    }
}
