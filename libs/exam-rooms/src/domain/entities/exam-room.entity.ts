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
        public readonly proctorSessionsCount: number | null = null,
        public readonly campus: string | null = null,
    ) { }

    /**
     * Factory method to create a new ExamRoom
     */
    static create(props: {
        id: string;
        roomNumber: string | number;
        capacity?: number | null;
        max_rows?: number | null;
        max_columns?: number | null;
        total_seats?: number | null;
        status?: string;
        maxRows?: number;
        maxColumns?: number;
        totalSeats?: number;
        campus?: string | null;
    }): ExamRoom {
        const roomNumber = RoomNumber.create(props.roomNumber);
        const capacity = props.capacity ? Capacity.create(props.capacity) : null;
        const maxRows = props.maxRows ?? props.max_rows ?? 6;
        const maxColumns = props.maxColumns ?? props.max_columns ?? 3;
        const totalSeats = props.totalSeats ?? props.total_seats ?? (maxRows * maxColumns);

        return new ExamRoom(
            props.id,
            roomNumber,
            capacity,
            props.status ?? 'Available',
            maxRows,
            maxColumns,
            totalSeats,
            new Date(),
            new Date(),
            null,
            props.campus ?? null,
        );
    }

    /**
     * Factory method to reconstitute ExamRoom from persistence
     */
    static reconstitute(props: {
        id: string;
        roomNumber: string | number;
        capacity: number | null;
        max_rows?: number | null;
        max_columns?: number | null;
        total_seats?: number | null;
        status: string;
        maxRows: number;
        maxColumns: number;
        totalSeats: number;
        createdAt: Date;
        updatedAt: Date;
        campus?: string | null;
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
            null,
            props.campus ?? null,
        );
    }

    static mapFromPrisma(found: any): ExamRoom {
        return ExamRoom.reconstitute({
            id: found.id,
            roomNumber: found.roomNumber,
            capacity: found.capacity,
            status: found.status,
            maxRows: found.max_rows,
            maxColumns: found.max_columns,
            totalSeats: found.total_seats,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
            campus: found.campus,
        });
    }

    /**
     * Update exam room details
     */
    update(props: {
        roomNumber?: string | number;
        capacity?: number | null;
        max_rows?: number;
        max_columns?: number;
        total_seats?: number;
        status?: string;
        maxRows?: number;
        maxColumns?: number;
        totalSeats?: number;
        campus?: string | null;
    }): ExamRoom {
        const roomNumber = props.roomNumber !== undefined
            ? RoomNumber.create(props.roomNumber)
            : this.roomNumber;

        const capacity = props.capacity !== undefined
            ? (props.capacity ? Capacity.create(props.capacity) : null)
            : this.capacity;

        const status = props.status !== undefined ? props.status : this.status;
        const maxRows = props.maxRows ?? props.max_rows ?? this.maxRows;
        const maxColumns = props.maxColumns ?? props.max_columns ?? this.maxColumns;
        const totalSeats = props.totalSeats ?? props.total_seats ?? (maxRows * maxColumns);
        const campus = props.campus !== undefined ? props.campus : this.campus;

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
            this.proctorSessionsCount,
            campus,
        );
    }
}
