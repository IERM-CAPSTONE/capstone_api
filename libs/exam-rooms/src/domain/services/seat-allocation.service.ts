export type SeatStatus = 'available' | 'blocked' | 'reserved';

export interface SeatCoordinate {
    row: number;
    column: number;
}

export interface Seat {
    row: number;
    column: number;
    id: string; // R{row}C{column}
    status: SeatStatus;
}

export interface SeatGridConfig {
    maxRows: number;
    maxColumns: number;
    totalSeats: number;
    blockedSeats?: SeatCoordinate[]; // seats that cannot be used (e.g., broken chairs)
    reservedSeats?: SeatCoordinate[]; // seats to keep aside; treated as non-assignable
}

export interface SeatAllocationOptions {
    seed?: number; // deterministic shuffle for testing
    occupiedSeatIds?: string[]; // seats already taken in this session to avoid double-booking
}

export interface StudentSeatAssignment {
    studentId: string;
    seatId: string;
    row: number;
    column: number;
}

/**
 * SeatAllocationService
 * - Generates seat grid from room dimensions
 * - Performs pure random assignment (no manual overrides)
 * - Prevents double-booking via occupied seat filtering
 */
export class SeatAllocationService {
    generateSeatGrid(config: SeatGridConfig): Seat[] {
        this.ensurePositive(config.maxRows, 'maxRows');
        this.ensurePositive(config.maxColumns, 'maxColumns');
        this.ensurePositive(config.totalSeats, 'totalSeats');

        const blocked = this.toSeatIdSet(config.blockedSeats);
        const reserved = this.toSeatIdSet(config.reservedSeats);

        const grid: Seat[] = [];
        let seatCounter = 0;

        for (let row = 1; row <= config.maxRows; row++) {
            for (let column = 1; column <= config.maxColumns; column++) {
                const id = this.makeSeatId(row, column);
                seatCounter++;

                const overCapacity = seatCounter > config.totalSeats;
                const isBlocked = blocked.has(id);
                const isReserved = reserved.has(id);

                const status: SeatStatus = overCapacity || isBlocked
                    ? 'blocked'
                    : isReserved
                        ? 'reserved'
                        : 'available';

                grid.push({ row, column, id, status });
            }
        }

        return grid;
    }

    validateSeatCapacity(grid: Seat[], requiredSeats: number, occupiedSeatIds: string[] = []): void {
        if (requiredSeats < 0) {
            throw new Error('Required seats must be non-negative');
        }

        const occupied = new Set(occupiedSeatIds);
        const availableCount = grid.filter((seat) => seat.status === 'available' && !occupied.has(seat.id)).length;

        if (availableCount < requiredSeats) {
            throw new Error(`Not enough available seats: required ${requiredSeats}, available ${availableCount}`);
        }
    }

    allocateStudents(
        studentIds: string[],
        config: SeatGridConfig,
        options: SeatAllocationOptions = {},
    ): { assignments: StudentSeatAssignment[]; remainingSeats: Seat[] } {
        const uniqueStudents = Array.from(new Set(studentIds));
        const grid = this.generateSeatGrid(config);

        const occupied = new Set(options.occupiedSeatIds ?? []);
        const availableSeats = grid.filter((seat) => seat.status === 'available' && !occupied.has(seat.id));

        this.validateSeatCapacity(grid, uniqueStudents.length, options.occupiedSeatIds ?? []);

        const rng = this.createRng(options.seed);
        const shuffledSeats = this.shuffle([...availableSeats], rng);

        const assignments: StudentSeatAssignment[] = [];

        for (let i = 0; i < uniqueStudents.length; i++) {
            const seat = shuffledSeats[i];
            assignments.push({
                studentId: uniqueStudents[i],
                seatId: seat.id,
                row: seat.row,
                column: seat.column,
            });
        }

        const remainingSeats = shuffledSeats.slice(uniqueStudents.length);

        return { assignments, remainingSeats };
    }

    private makeSeatId(row: number, column: number): string {
        return `R${row}C${column}`;
    }

    private toSeatIdSet(seats?: SeatCoordinate[]): Set<string> {
        if (!seats) return new Set();
        return new Set(seats.map((seat) => this.makeSeatId(seat.row, seat.column)));
    }

    private ensurePositive(value: number, field: string): void {
        if (!Number.isInteger(value) || value <= 0) {
            throw new Error(`${field} must be a positive integer`);
        }
    }

    private createRng(seed?: number): () => number {
        if (seed === undefined) return Math.random;
        // Deterministic RNG (mulberry32)
        let t = seed >>> 0;
        return () => {
            t += 0x6d2b79f5;
            let r = Math.imul(t ^ (t >>> 15), 1 | t);
            r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
            return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
        };
    }

    private shuffle<T>(items: T[], rng: () => number): T[] {
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }
        return items;
    }
}

export const seatAllocationService = new SeatAllocationService();
