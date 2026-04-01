import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString, IsArray, ArrayUnique } from 'class-validator';

export class UpdateProctorApplicationDto {
    @ApiProperty({ example: 'MORNING', enum: ['MORNING', 'AFTERNOON'], description: 'Preferred shift', required: false })
    @IsOptional()
    @IsEnum(['MORNING', 'AFTERNOON'])
    preferredShift?: string;

    @ApiProperty({ example: 'ROOM', enum: ['ROOM', 'HALL'], description: 'Preferred type', required: false })
    @IsOptional()
    @IsEnum(['ROOM', 'HALL'])
    preferredType?: string;

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

    @ApiProperty({ example: 'Updated notes', description: 'Additional notes', required: false, nullable: true })
    @IsOptional()
    @IsString()
    notes?: string | null;
}
