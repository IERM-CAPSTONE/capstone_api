/**
 * UserCode Value Object
 * Represents MSSV (student ID) or Teacher code
 */
export class UserCode {
    private constructor(private readonly _value: string) { }

    get value(): string {
        return this._value;
    }

    static create(code: string): UserCode {
        if (!code || code.trim().length === 0) {
            throw new Error('User code cannot be empty');
        }

        const normalized = code.toUpperCase().trim();

        if (normalized.length < 2 || normalized.length > 20) {
            throw new Error('User code must be between 2 and 20 characters');
        }

        return new UserCode(normalized);
    }

    static fromPersistence(code: string): UserCode {
        return new UserCode(code);
    }

    equals(other: UserCode): boolean {
        return this._value === other._value;
    }

    toString(): string {
        return this._value;
    }
}
