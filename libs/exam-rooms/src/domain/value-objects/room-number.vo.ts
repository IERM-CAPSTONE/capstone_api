/**
 * RoomNumber Value Object
 * Encapsulates room number validation logic
 */
export class RoomNumber {
    private readonly _value: string;

    private constructor(value: string) {
        this._value = value;
    }

    static create(value: string | number): RoomNumber {
        const stringValue = value.toString().trim();
        if (!stringValue) {
            throw new Error('Room number cannot be empty');
        }
        return new RoomNumber(stringValue);
    }

    get value(): string {
        return this._value;
    }

    equals(other: RoomNumber): boolean {
        return this._value === other._value;
    }
}
