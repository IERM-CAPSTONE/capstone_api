import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class RegisterDeviceApplicationDto {
    @ApiProperty({ example: 'device-serial', description: 'Device serial' })
    @IsString()
    @IsNotEmpty()
    serial: string;

    @ApiProperty({ example: 'Samsung A54', description: 'Device name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: 'Device metadata', required: false, nullable: true })
    @IsOptional()
    @IsObject()
    metadata?: Record<string, unknown> | null;
}
