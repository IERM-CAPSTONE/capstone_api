import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateProctorApplicationDto {
    @ApiProperty({ example: 'MORNING', enum: ['MORNING', 'AFTERNOON'], description: 'Preferred shift', required: false })
    @IsOptional()
    @IsEnum(['MORNING', 'AFTERNOON'])
    preferredShift?: string;

    @ApiProperty({ example: 'ROOM', enum: ['ROOM', 'HALL'], description: 'Preferred type', required: false })
    @IsOptional()
    @IsEnum(['ROOM', 'HALL'])
    preferredType?: string;

    @ApiProperty({ example: '2026-02-15T00:00:00.000Z', description: 'Preferred date', required: false, nullable: true })
    @IsOptional()
    @IsDateString()
    preferredDate?: Date | null;

    @ApiProperty({ example: 'Updated notes', description: 'Additional notes', required: false, nullable: true })
    @IsOptional()
    @IsString()
    notes?: string | null;
}
