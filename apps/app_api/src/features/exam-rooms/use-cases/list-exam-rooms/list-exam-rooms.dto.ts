import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';

/**
 * List ExamRooms - Query DTO
 */
export class ListExamRoomsDto {
    @ApiProperty({ example: 1, description: 'Page number', required: false, default: 1 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    page?: number;

    @ApiProperty({ example: 10, description: 'Items per page', required: false, default: 10 })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Type(() => Number)
    limit?: number;

    @ApiProperty({ example: '101', description: 'Filter by room number', required: false })
    @IsOptional()
    @IsString()
    roomNumber?: string;

    @ApiProperty({ example: 'HCM', description: 'Filter by campus', required: false, isArray: true })
    @IsOptional()
    @Transform(({ value }) => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') return value.split(',').filter(Boolean);
        return value ? [value] : [];
    })
    @IsArray()
    @IsString({ each: true })
    campus?: string[];
}
