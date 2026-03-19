import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';

export class ListAllDeviceApplicationsDto {
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

    @ApiProperty({ example: 'uuid', description: 'Filter by device ID', required: false })
    @IsOptional()
    @IsString()
    deviceId?: string;

    @ApiProperty({ example: 'uuid', description: 'Filter by registered user ID', required: false })
    @IsOptional()
    @IsString()
    registeredBy?: string;

    @ApiProperty({ example: 'PENDING', enum: ['PENDING', 'APPROVED', 'REJECTED'], description: 'Filter by status', required: false })
    @IsOptional()
    @IsEnum(['PENDING', 'APPROVED', 'REJECTED'])
    status?: string;
}
