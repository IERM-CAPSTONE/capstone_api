import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateExamPartDto {
    @ApiProperty({ example: 'Multiple Choice Updated', description: 'Exam type name', required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ example: 'Updated description', description: 'Description', required: false })
    @IsString()
    @IsOptional()
    description?: string;
}
