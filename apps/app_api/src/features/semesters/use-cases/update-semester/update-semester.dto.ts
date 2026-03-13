import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateSemesterDto {
    @ApiProperty({ example: 'Summer 2025 Revised', required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ example: '2025-05-01T00:00:00Z', required: false })
    @IsOptional()
    @IsDateString()
    startDate?: string;

    @ApiProperty({ example: '2025-08-31T23:59:59Z', required: false })
    @IsOptional()
    @IsDateString()
    endDate?: string;
}
