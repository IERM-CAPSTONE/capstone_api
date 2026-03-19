import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateDeviceStatusDto {
    @ApiProperty({ example: true, description: 'Active status' })
    @IsBoolean()
    isActive: boolean;
}
