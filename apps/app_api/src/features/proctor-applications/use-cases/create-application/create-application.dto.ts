import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsDateString, IsArray, ArrayUnique } from 'class-validator';

export class CreateProctorApplicationDto {
    @ApiProperty({ example: 'MORNING', enum: ['MORNING', 'AFTERNOON'], description: 'Preferred shift' })
    @IsEnum(['MORNING', 'AFTERNOON'])
    @IsNotEmpty()
    preferredShift: string;

    @ApiProperty({ example: 'ROOM', enum: ['ROOM', 'HALL'], description: 'Preferred type' })
    @IsEnum(['ROOM', 'HALL'])
    @IsNotEmpty()
    preferredType: string;

    @ApiProperty({
        example: ['2026-02-15', '2026-02-18'],
        description: 'One or many preferred dates',
        required: false,
        nullable: true,
        type: [String],
    })
    @IsOptional()
    @IsArray()
    @ArrayUnique()
    @IsDateString({}, { each: true })
    preferredDates?: string[];

    @ApiProperty({ example: 'Available on this date', description: 'Additional notes', required: false, nullable: true })
    @IsOptional()
    @IsString()
    notes?: string | null;
}
