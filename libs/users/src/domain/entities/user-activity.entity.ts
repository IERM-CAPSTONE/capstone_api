/**
 * User Activity Entity
 * Audit log record for account activities
 */
export class UserActivity {
    private constructor(
        private readonly _id: string,
        private readonly _userId: string,
        private readonly _type: string,
        private readonly _details: string | null,
        private readonly _performer: string,
        private readonly _timestamp: Date,
    ) { }

    get id(): string { return this._id; }
    get userId(): string { return this._userId; }
    get type(): string { return this._type; }
    get details(): string | null { return this._details; }
    get performer(): string { return this._performer; }
    get timestamp(): Date { return this._timestamp; }

    static create(props: {
        id: string;
        userId: string;
        type: string;
        details?: string;
        performer: string;
        timestamp?: Date;
    }): UserActivity {
        return new UserActivity(
            props.id,
            props.userId,
            props.type,
            props.details ?? null,
            props.performer,
            props.timestamp ?? new Date(),
        );
    }
}
