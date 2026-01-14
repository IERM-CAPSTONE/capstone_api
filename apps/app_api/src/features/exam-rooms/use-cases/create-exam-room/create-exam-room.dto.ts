import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, Min, IsString, IsNotEmpty, IsEnum } from 'class-validator';

/**
 * Create ExamRoom - Request DTO
 */
export class CreateExamRoomDto {
    @ApiProperty({ example: '101', description: 'Room number' })
    @IsString()
    roomNumber: string;

    @ApiProperty({ example: 30, description: 'Room capacity', required: false, nullable: true })
    @IsOptional()
    @IsInt()
    @Min(1)
    capacity?: number | null;

    @ApiProperty({ example: 'Available', enum: ['Available', 'Occupied', 'Maintenance', 'Exam_Ongoing', 'For_Exam'], description: 'Room status', required: false })
    @IsOptional()
    @IsEnum(['Available', 'Occupied', 'Maintenance', 'Exam_Ongoing', 'For_Exam'])
    status?: string;
}
