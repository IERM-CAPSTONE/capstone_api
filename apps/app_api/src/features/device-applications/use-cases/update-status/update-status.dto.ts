import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateDeviceApplicationStatusDto {
    @ApiProperty({ example: 'APPROVED', enum: ['APPROVED', 'REJECTED'], description: 'New status' })
    @IsEnum(['APPROVED', 'REJECTED'])
    @IsNotEmpty()
    status: string;

    @ApiProperty({ example: 'Missing info', description: 'Rejected reason', required: false })
    @IsOptional()
    @IsString()
    rejectedReason?: string;
}
