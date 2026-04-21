import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsEnum, IsString, IsInt, Min, IsDateString } from 'class-validator';

export class ListAllProctorApplicationsDto {
    @ApiProperty({ example: 1, description: 'Page number', required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @ApiProperty({ example: 10, description: 'Records per page', required: false })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number;

    @ApiProperty({ example: 'uuid', description: 'Filter by teacher ID', required: false })
    @IsOptional()
    @IsString()
    teacherId?: string;

    @ApiProperty({ example: 'PENDING', enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELED'], description: 'Filter by status', required: false })
    @IsOptional()
    @IsEnum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELED'])
    status?: string;

    @ApiProperty({ example: '2026-02-01T00:00:00.000Z', description: 'Filter by date start', required: false })
    @IsOptional()
    @IsDateString()
    preferredDateStart?: Date;

    @ApiProperty({ example: '2026-02-28T23:59:59.999Z', description: 'Filter by date end', required: false })
    @IsOptional()
    @IsDateString()
    preferredDateEnd?: Date;
}
