import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateSemesterDto {
    @ApiProperty({ example: 'SU25' })
    @IsNotEmpty()
    @IsString()
    code: string;

    @ApiProperty({ example: 'Summer 2025', required: false })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({ example: '2025-05-01T00:00:00Z' })
    @IsDateString()
    startDate: string;

    @ApiProperty({ example: '2025-08-31T23:59:59Z' })
    @IsDateString()
    endDate: string;
}
