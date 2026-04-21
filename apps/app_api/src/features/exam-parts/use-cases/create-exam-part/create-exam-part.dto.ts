import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateExamPartDto {
    @ApiProperty({ example: 'MC', description: 'Exam type code' })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({ example: 'Multiple Choice', description: 'Exam type name', required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ example: 'Theory exam with multiple choice questions', description: 'Description', required: false })
    @IsString()
    @IsOptional()
    description?: string;
}
