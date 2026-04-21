/**
 * SubjectCode Value Object
 */
export class SubjectCode {
    private readonly _value: string;

    private constructor(value: string) {
        this._value = value;
    }

    static create(value: string | null | undefined): SubjectCode | null {
        if (!value) return null;
        if (value.trim().length === 0) {
            throw new Error('Subject code cannot be empty');
        }
        return new SubjectCode(value.trim().toUpperCase());
    }

    get value(): string {
        return this._value;
    }
}
