import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class MonitorSummaryQueryDto {
    @ApiProperty({ required: false, enum: ['HCM', 'HN', 'DN', 'QN', 'CT'] })
    @IsOptional()
    @IsString()
    campus?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    semesterId?: string;

    @ApiProperty({ required: false, description: 'Date in YYYY-MM-DD format' })
    @IsOptional()
    @IsString()
    date?: string;
}
