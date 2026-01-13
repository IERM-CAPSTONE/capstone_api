/**
 * RoomNumber Value Object
 * Encapsulates room number validation logic
 */
export class RoomNumber {
    private readonly _value: number;

    private constructor(value: number) {
        this._value = value;
    }

    static create(value: number): RoomNumber {
        if (value <= 0) {
            throw new Error('Room number must be a positive number');
        }
        return new RoomNumber(value);
    }

    get value(): number {
        return this._value;
    }

    equals(other: RoomNumber): boolean {
        return this._value === other._value;
    }
}
