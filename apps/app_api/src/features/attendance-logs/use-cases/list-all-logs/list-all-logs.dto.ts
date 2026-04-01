import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, IsBoolean, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class ListAllLogsDto {
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

    @ApiProperty({ example: 'user-uuid', description: 'Filter by studentId', required: false })
    @IsOptional()
    @IsString()
    studentId?: string;

    @ApiProperty({ example: 'session-uuid', description: 'Filter by examSessionId', required: false })
    @IsOptional()
    @IsString()
    examSessionId?: string;

    @ApiProperty({ example: 'device-uuid', description: 'Filter by deviceId', required: false })
    @IsOptional()
    @IsString()
    deviceId?: string;

    @ApiProperty({ example: 'SUCCESS', description: 'Filter by status', required: false })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiProperty({ example: 'SE123456', description: 'Filter by studentCode', required: false })
    @IsOptional()
    @IsString()
    studentCode?: string;

    @ApiProperty({ example: true, description: 'Filter by room check result', required: false })
    @IsOptional()
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
    @IsBoolean()
    isCorrectRoom?: boolean;

    @ApiProperty({ example: '2026-01-01T00:00:00.000Z', description: 'Filter logs from this time (ISO)', required: false })
    @IsOptional()
    @IsDateString()
    fromTime?: string;

    @ApiProperty({ example: '2026-01-31T23:59:59.999Z', description: 'Filter logs to this time (ISO)', required: false })
    @IsOptional()
    @IsDateString()
    toTime?: string;
}
