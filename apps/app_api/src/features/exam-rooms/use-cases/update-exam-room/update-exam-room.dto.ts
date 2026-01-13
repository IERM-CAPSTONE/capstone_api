import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, Min } from 'class-validator';

/**
 * Update ExamRoom - Request DTO
 */
export class UpdateExamRoomDto {
    @ApiProperty({ example: 101, description: 'Room number', required: false })
    @IsOptional()
    @IsInt()
    @IsPositive()
    roomNumber?: number;

    @ApiProperty({ example: 30, description: 'Room capacity', required: false, nullable: true })
    @IsOptional()
    @IsInt()
    @Min(1)
    capacity?: number | null;
}
