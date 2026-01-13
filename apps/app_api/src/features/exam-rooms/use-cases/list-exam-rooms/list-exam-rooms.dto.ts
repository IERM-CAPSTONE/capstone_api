import { ApiProperty } from '@nestjs/swagger';

/**
 * List ExamRooms - Query DTO
 */
export class ListExamRoomsDto {
    @ApiProperty({ example: 1, description: 'Page number', required: false, default: 1 })
    page?: number;

    @ApiProperty({ example: 10, description: 'Items per page', required: false, default: 10 })
    limit?: number;

    @ApiProperty({ example: 101, description: 'Filter by room number', required: false })
    roomNumber?: number;
}
