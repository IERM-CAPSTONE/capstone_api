/**
 * ExamPart Entity
 */
export class ExamPart {
    private constructor(
        public readonly id: string,
        public readonly code: string,
        public readonly name: string | null,
        public readonly description: string | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) { }

    static create(props: {
        id: string;
        code: string;
        name?: string | null;
        description?: string | null;
    }): ExamPart {
        if (!props.code || props.code.trim() === '') {
            throw new Error('Exam part code must not be empty');
        }

        return new ExamPart(
            props.id,
            props.code.trim(),
            props.name ?? null,
            props.description ?? null,
            new Date(),
            new Date(),
        );
    }

    static reconstitute(props: {
        id: string;
        code: string;
        name: string | null;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
    }): ExamPart {
        return new ExamPart(
            props.id,
            props.code,
            props.name,
            props.description,
            props.createdAt,
            props.updatedAt,
        );
    }

    static mapFromPrisma(found: any): ExamPart {
        return ExamPart.reconstitute({
            id: found.id,
            code: found.code,
            name: found.name,
            description: found.description,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
        });
    }

    update(props: {
        code?: string;
        name?: string | null;
        description?: string | null;
    }): ExamPart {
        return new ExamPart(
            this.id,
            props.code !== undefined ? props.code.trim() : this.code,
            props.name !== undefined ? props.name : this.name,
            props.description !== undefined ? props.description : this.description,
            this.createdAt,
            new Date(),
        );
    }
}
