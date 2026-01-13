import { ApiProperty } from '@nestjs/swagger';
import { ExamRoom } from '@app/exam-rooms';

/**
 * ExamRoom Response DTO
 */
export class ExamRoomResponse {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'ExamRoom UUID' })
    id: string;

    @ApiProperty({ example: 101, description: 'Room number' })
    roomNumber: number;

    @ApiProperty({ example: 30, description: 'Room capacity', nullable: true })
    capacity: number | null;

    @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Creation timestamp' })
    createdAt: Date;

    @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update timestamp' })
    updatedAt: Date;
}

/**
 * Map ExamRoom aggregate to Response DTO
 */
export function toExamRoomResponse(examRoom: ExamRoom): ExamRoomResponse {
    return {
        id: examRoom.id,
        roomNumber: examRoom.roomNumber.value,
        capacity: examRoom.capacity?.value ?? null,
        createdAt: examRoom.createdAt,
        updatedAt: examRoom.updatedAt,
    };
}

/**
 * Paginated Response
 */
export class PaginatedExamRoomResponse {
    @ApiProperty({ type: [ExamRoomResponse], description: 'Array of exam rooms' })
    data: ExamRoomResponse[];

    @ApiProperty({ example: 100, description: 'Total number of exam rooms' })
    total: number;

    @ApiProperty({ example: 1, description: 'Current page number' })
    page: number;

    @ApiProperty({ example: 10, description: 'Number of items per page' })
    limit: number;

    @ApiProperty({ example: 10, description: 'Total number of pages' })
    totalPages: number;
}
