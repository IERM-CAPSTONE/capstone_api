import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateProctorApplicationStatusDto {
    @ApiProperty({ example: 'APPROVED', enum: ['APPROVED', 'REJECTED'], description: 'Target proctor response to the swap request' })
    @IsEnum(['APPROVED', 'REJECTED'])
    @IsNotEmpty()
    status: string;
}
