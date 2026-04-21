/**
 * Capacity Value Object
 * Encapsulates room capacity validation logic
 */
export class Capacity {
    private readonly _value: number;

    private constructor(value: number) {
        this._value = value;
    }

    static create(value: number): Capacity {
        if (value <= 0) {
            throw new Error('Capacity must be a positive number');
        }
        return new Capacity(value);
    }

    get value(): number {
        return this._value;
    }

    equals(other: Capacity): boolean {
        return this._value === other._value;
    }
}
