import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ListAllDevicesDto {
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

    @ApiProperty({ example: 'uuid', description: 'Filter by ownerId', required: false })
    @IsOptional()
    @IsString()
    ownerId?: string;

    @ApiProperty({ example: true, description: 'Filter by active status', required: false })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (value === undefined || value === null || value === '') return undefined;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
            const normalized = value.trim().toLowerCase();
            if (normalized === 'true') return true;
            if (normalized === 'false') return false;
        }
        return value;
    })
    isActive?: boolean;
}
