/**
 * SemesterCode Value Object
 */
export class SemesterCode {
    private readonly _value: string;

    private constructor(value: string) {
        this._value = value;
    }

    static create(value: string | null | undefined): SemesterCode | null {
        if (!value) return null;
        // Có thể thêm validation format học kỳ ở đây (ví dụ: FA23, SP24)
        if (value.trim().length === 0) {
            throw new Error('Semester code cannot be empty');
        }
        return new SemesterCode(value.trim().toUpperCase());
    }

    get value(): string {
        return this._value;
    }
}
