export class Identity {
    constructor(
        private readonly _id: string,
        private readonly _studentId: string,
        private readonly _faceImage: string | null,
        private readonly _isValid: boolean,
        private readonly _createdAt: Date,
        private readonly _updatedAt: Date,
    ) { }

    get id(): string { return this._id; }
    get studentId(): string { return this._studentId; }
    get faceImage(): string | null { return this._faceImage; }
    get isValid(): boolean { return this._isValid; }
    get createdAt(): Date { return this._createdAt; }
    get updatedAt(): Date { return this._updatedAt; }

    static fromPersistence(props: any): Identity {
        return new Identity(
            props.id,
            props.studentId,
            props.faceImage,
            props.isValid,
            props.createdAt,
            props.updatedAt,
        );
    }
}
