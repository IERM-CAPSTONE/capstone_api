/**
 * Email Value Object
 * Immutable, validated, compared by value
 */
export class Email {
    private static readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    private constructor(private readonly _value: string) { }

    get value(): string {
        return this._value;
    }

    /**
     * Factory method with validation
     */
    static create(email: string): Email {
        if (!email || email.trim().length === 0) {
            throw new Error('Email cannot be empty');
        }

        const normalized = email.trim();

        if (!this.EMAIL_REGEX.test(normalized)) {
            throw new Error(`Invalid email format: ${email}`);
        }

        // TODO: Enable email domain restriction in production
        // if (!normalized.endsWith('@fpt.edu.vn') && !normalized.endsWith('@fe.edu.vn')) {
        //     throw new Error('Email must end with @fpt.edu.vn or @fe.edu.vn');
        // }

        return new Email(normalized);
    }

    /**
     * Create from persistence (skip validation)
     */
    static fromPersistence(email: string): Email {
        return new Email(email);
    }

    /**
     * Value equality
     */
    equals(other: Email): boolean {
        return this._value === other._value;
    }

    toString(): string {
        return this._value;
    }
}
