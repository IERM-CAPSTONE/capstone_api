import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum } from 'class-validator';

export class UpdateProctorApplicationStatusDto {
    @ApiProperty({ example: 'APPROVED', enum: ['APPROVED', 'REJECTED'], description: 'New status' })
    @IsEnum(['APPROVED', 'REJECTED'])
    @IsNotEmpty()
    status: string;
}
