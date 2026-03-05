import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, IsString, IsUUID, Min } from 'class-validator';

/**
 * Auto-Generate Schedule - Request DTO
 */
export class AutoGenerateScheduleDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Semester ID' })
    @IsUUID()
    semesterId: string;

    @ApiProperty({ example: 'HCM', enum: ['HCM', 'HN', 'DN', 'QN', 'CT'], description: 'Campus' })
    @IsEnum(['HCM', 'HN', 'DN', 'QN', 'CT'])
    campus: string;

    @ApiProperty({ example: 11, description: 'Final exam week' })
    @IsNumber()
    @Min(1)
    finalWeek: number;

    @ApiProperty({ example: 12, description: 'Retake exam week' })
    @IsNumber()
    @Min(1)
    retakeWeek: number;

    @ApiProperty({ example: [], description: 'List of selected room IDs' })
    @IsArray()
    @IsUUID('4', { each: true })
    roomIds: string[];

    @ApiProperty({ description: 'Base64 encoded CSV file data' })
    @IsString()
    fileData: string;
}
