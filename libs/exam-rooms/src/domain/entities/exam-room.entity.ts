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
        public readonly status: string,
        public readonly maxRows: number,
        public readonly maxColumns: number,
        public readonly totalSeats: number,
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
        status?: string;
        maxRows?: number;
        maxColumns?: number;
        totalSeats?: number;
    }): ExamRoom {
        const roomNumber = RoomNumber.create(props.roomNumber);
        const capacity = props.capacity ? Capacity.create(props.capacity) : null;

        return new ExamRoom(
            props.id,
            roomNumber,
            capacity,
            props.status ?? 'Available',
            props.maxRows ?? 5,
            props.maxColumns ?? 6,
            props.totalSeats ?? 30,
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
        status: string;
        maxRows: number;
        maxColumns: number;
        totalSeats: number;
        createdAt: Date;
        updatedAt: Date;
    }): ExamRoom {
        const roomNumber = RoomNumber.create(props.roomNumber);
        const capacity = props.capacity ? Capacity.create(props.capacity) : null;

        return new ExamRoom(
            props.id,
            roomNumber,
            capacity,
            props.status,
            props.maxRows,
            props.maxColumns,
            props.totalSeats,
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
        status?: string;
        maxRows?: number;
        maxColumns?: number;
        totalSeats?: number;
    }): ExamRoom {
        const roomNumber = props.roomNumber !== undefined
            ? RoomNumber.create(props.roomNumber)
            : this.roomNumber;

        const capacity = props.capacity !== undefined
            ? (props.capacity ? Capacity.create(props.capacity) : null)
            : this.capacity;

        const status = props.status !== undefined ? props.status : this.status;
        const maxRows = props.maxRows !== undefined ? props.maxRows : this.maxRows;
        const maxColumns = props.maxColumns !== undefined ? props.maxColumns : this.maxColumns;
        const totalSeats = props.totalSeats !== undefined ? props.totalSeats : this.totalSeats;

        return new ExamRoom(
            this.id,
            roomNumber,
            capacity,
            status,
            maxRows,
            maxColumns,
            totalSeats,
            this.createdAt,
            new Date(),
        );
    }
}
