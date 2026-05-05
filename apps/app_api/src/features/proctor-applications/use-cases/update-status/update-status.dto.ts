import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProctorApplicationStatusDto {
    @ApiProperty({ example: 'APPROVED', enum: ['APPROVED', 'REJECTED'], description: 'Target proctor response to the swap request' })
    @IsEnum(['APPROVED', 'REJECTED'])
    @IsNotEmpty()
    status: string;

    @ApiProperty({ example: 'I already have another commitment at this time.', required: false, nullable: true, description: 'Optional response note when rejecting a swap request' })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    responseNote?: string | null;
}
