/**
 * SubjectPart Entity
 */
export class SubjectPart {
    private constructor(
        public readonly id: string,
        public readonly subjectId: string,
        public readonly examPartId: string,
        public readonly duration: number | null,
        public readonly examPart: any | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) { }

    static create(props: {
        id: string;
        subjectId: string;
        examPartId: string;
        duration?: number | null;
        examPart?: any | null;
    }): SubjectPart {
        return new SubjectPart(
            props.id,
            props.subjectId,
            props.examPartId,
            props.duration ?? null,
            props.examPart ?? null,
            new Date(),
            new Date(),
        );
    }

    static reconstitute(props: {
        id: string;
        subjectId: string;
        examPartId: string;
        duration: number | null;
        examPart: any | null;
        createdAt: Date;
        updatedAt: Date;
    }): SubjectPart {
        return new SubjectPart(
            props.id,
            props.subjectId,
            props.examPartId,
            props.duration,
            props.examPart,
            props.createdAt,
            props.updatedAt,
        );
    }
}
