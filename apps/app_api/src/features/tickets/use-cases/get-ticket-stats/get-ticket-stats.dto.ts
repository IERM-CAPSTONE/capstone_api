import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class GetTicketStatsQueryDto {
    @ApiProperty({ description: 'Semester id used as the primary reporting scope' })
    @IsString()
    semesterId: string;

    @ApiPropertyOptional({ description: 'Week number in the selected semester', example: 11 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    week?: number;
}
