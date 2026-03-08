import { SubjectPart } from './subject-part.entity';

/**
 * Subject Aggregate Root
 */
export class Subject {
    private constructor(
        public readonly id: string,
        public readonly code: string,
        public readonly name: string | null,
        public readonly semesterId: string | null,
        public readonly department: string | null,
        public readonly isCoursera: boolean,
        public readonly parts: SubjectPart[],
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
        public readonly semester?: { id: string; code: string; name: string } | null,
    ) { }

    static create(props: {
        id: string;
        code: string;
        name?: string | null;
        semesterId?: string | null;
        department?: string | null;
        isCoursera?: boolean;
        parts?: SubjectPart[];
    }): Subject {
        if (!props.code || props.code.trim() === '') {
            throw new Error('Subject code must not be empty');
        }

        return new Subject(
            props.id,
            props.code.trim(),
            props.name ?? null,
            props.semesterId ?? null,
            props.department ?? null,
            props.isCoursera ?? false,
            props.parts ?? [],
            new Date(),
            new Date(),
        );
    }

    static reconstitute(props: {
        id: string;
        code: string;
        name: string | null;
        semesterId: string | null;
        department: string | null;
        isCoursera: boolean;
        parts: SubjectPart[];
        createdAt: Date;
        updatedAt: Date;
        semester?: { id: string; code: string; name: string } | null;
    }): Subject {
        return new Subject(
            props.id,
            props.code,
            props.name,
            props.semesterId,
            props.department,
            props.isCoursera,
            props.parts,
            props.createdAt,
            props.updatedAt,
            props.semester,
        );
    }

    static mapFromPrisma(found: any): Subject {
        const parts = found.parts
            ? found.parts.map((p: any) => SubjectPart.reconstitute({
                id: p.id,
                subjectId: p.subjectId,
                examPartId: p.examPartId,
                duration: p.duration,
                examPart: p.examPart ? p.examPart : null,
                createdAt: p.createdAt,
                updatedAt: p.updatedAt,
            }))
            : [];

        return Subject.reconstitute({
            id: found.id,
            code: found.code,
            name: found.name,
            semesterId: found.semesterId,
            department: found.department,
            isCoursera: found.isCoursera ?? false,
            parts,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
            semester: found.semester ? {
                id: found.semester.id,
                code: found.semester.code,
                name: found.semester.name,
            } : null,
        });
    }

    update(props: {
        name?: string | null;
        semesterId?: string | null;
        department?: string | null;
        isCoursera?: boolean;
    }): Subject {
        return new Subject(
            this.id,
            this.code,
            props.name !== undefined ? props.name : this.name,
            props.semesterId !== undefined ? props.semesterId : this.semesterId,
            props.department !== undefined ? props.department : this.department,
            props.isCoursera !== undefined ? props.isCoursera : this.isCoursera,
            this.parts,
            this.createdAt,
            new Date(),
        );
    }
}
