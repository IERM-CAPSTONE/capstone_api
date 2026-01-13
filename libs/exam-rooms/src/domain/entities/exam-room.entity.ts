import { RoomNumber } from '../value-objects/room-number.vo';
import { Capacity } from '../value-objects/capacity.vo';

/**
 * ExamRoom Aggregate Root
 * Encapsulates exam room business logic
 */
export class ExamRoom {
    private constructor(
        public readonly id: string,
        public readonly roomNumber: RoomNumber,
        public readonly capacity: Capacity | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) { }

    /**
     * Factory method to create a new ExamRoom
     */
    static create(props: {
        id: string;
        roomNumber: string | number;
        capacity?: number | null;
    }): ExamRoom {
        const roomNumber = RoomNumber.create(props.roomNumber);
        const capacity = props.capacity ? Capacity.create(props.capacity) : null;

        return new ExamRoom(
            props.id,
            roomNumber,
            capacity,
            new Date(),
            new Date(),
        );
    }

    /**
     * Factory method to reconstitute ExamRoom from persistence
     */
    static reconstitute(props: {
        id: string;
        roomNumber: string | number;
        capacity: number | null;
        createdAt: Date;
        updatedAt: Date;
    }): ExamRoom {
        const roomNumber = RoomNumber.create(props.roomNumber);
        const capacity = props.capacity ? Capacity.create(props.capacity) : null;

        return new ExamRoom(
            props.id,
            roomNumber,
            capacity,
            props.createdAt,
            props.updatedAt,
        );
    }

    /**
     * Update exam room details
     */
    update(props: {
        roomNumber?: string | number;
        capacity?: number | null;
    }): ExamRoom {
        const roomNumber = props.roomNumber !== undefined
            ? RoomNumber.create(props.roomNumber)
            : this.roomNumber;

        const capacity = props.capacity !== undefined
            ? (props.capacity ? Capacity.create(props.capacity) : null)
            : this.capacity;

        return new ExamRoom(
            this.id,
            roomNumber,
            capacity,
            this.createdAt,
            new Date(),
        );
    }
}
