/**
 * Semester Aggregate Root
 */
export class Semester {
    private constructor(
        public readonly id: string,
        public readonly code: string,
        public readonly name: string | null,
        public readonly startDate: Date,
        public readonly endDate: Date,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) { }

    static create(props: {
        id: string;
        code: string;
        name?: string | null;
        startDate: Date;
        endDate: Date;
    }): Semester {
        if (!props.code || props.code.trim() === '') {
            throw new Error('Semester code must not be empty');
        }

        if (props.startDate >= props.endDate) {
            throw new Error('Start date must be before end date');
        }

        return new Semester(
            props.id,
            props.code.trim().toUpperCase(),
            props.name ?? null,
            props.startDate,
            props.endDate,
            new Date(),
            new Date(),
        );
    }

    static reconstitute(props: {
        id: string;
        code: string;
        name: string | null;
        startDate: Date;
        endDate: Date;
        createdAt: Date;
        updatedAt: Date;
    }): Semester {
        return new Semester(
            props.id,
            props.code,
            props.name,
            props.startDate,
            props.endDate,
            props.createdAt,
            props.updatedAt,
        );
    }

    static mapFromPrisma(found: any): Semester {
        return Semester.reconstitute({
            id: found.id,
            code: found.code,
            name: found.name,
            startDate: found.startDate,
            endDate: found.endDate,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
        });
    }

    update(props: {
        code?: string;
        name?: string | null;
        startDate?: Date;
        endDate?: Date;
    }): Semester {
        const newCode = props.code !== undefined ? props.code.trim().toUpperCase() : this.code;
        const newStartDate = props.startDate !== undefined ? props.startDate : this.startDate;
        const newEndDate = props.endDate !== undefined ? props.endDate : this.endDate;

        if (!newCode) {
            throw new Error('Semester code must not be empty');
        }

        if (newStartDate >= newEndDate) {
            throw new Error('Start date must be before end date');
        }

        return new Semester(
            this.id,
            newCode,
            props.name !== undefined ? props.name : this.name,
            newStartDate,
            newEndDate,
            this.createdAt,
            new Date(),
        );
    }
}
