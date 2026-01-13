import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, Min, IsString } from 'class-validator';

/**
 * Update ExamRoom - Request DTO
 */
export class UpdateExamRoomDto {
    @ApiProperty({ example: '101', description: 'Room number', required: false })
    @IsOptional()
    @IsString()
    roomNumber?: string;

    @ApiProperty({ example: 30, description: 'Room capacity', required: false, nullable: true })
    @IsOptional()
    @IsInt()
    @Min(1)
    capacity?: number | null;
}
