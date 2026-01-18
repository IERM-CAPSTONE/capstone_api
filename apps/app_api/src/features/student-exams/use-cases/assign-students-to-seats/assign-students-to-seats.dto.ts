import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray, IsOptional, IsInt } from 'class-validator';

/**
 * Assign Students to Seats - Request DTO
 */
export class AssignStudentsToSeatsDto {
    @ApiProperty({ description: 'Exam session ID' })
    @IsString()
    @IsNotEmpty()
    examSessionId: string;

    @ApiProperty({ description: 'List of student IDs to assign to seats' })
    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty()
    studentIds: string[];

    @ApiProperty({
        description: 'Random seed for reproducible assignments (optional, for testing)',
        required: false,
        nullable: true,
    })
    @IsOptional()
    @IsInt()
    randomSeed?: number;
}
