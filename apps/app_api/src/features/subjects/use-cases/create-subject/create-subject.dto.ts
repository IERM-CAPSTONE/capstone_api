import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSubjectPartDto {
    @ApiProperty({ example: 'uuid-exam-type', description: 'Exam type ID' })
    @IsString()
    @IsNotEmpty()
    examPartId: string;

    @ApiProperty({ example: 60, description: 'Duration in minutes', required: false })
    @IsOptional()
    @IsInt()
    duration?: number;
}

export class CreateSubjectDto {
    @ApiProperty({ example: 'PRN231', description: 'Subject code' })
    @IsString()
    @IsNotEmpty()
    code: string;

    @ApiProperty({ example: 'Java Desktop Application', description: 'Subject name', required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ example: 'semester-uuid', description: 'Semester ID', required: false })
    @IsString()
    @IsOptional()
    semesterId?: string;

    @ApiProperty({ example: 'SE', description: 'Department', required: false })
    @IsString()
    @IsOptional()
    department?: string;

    @ApiProperty({ example: false, description: 'Is Coursera subject', required: false })
    @IsOptional()
    isCoursera?: boolean;

    @ApiProperty({ example: false, description: 'Is Major subject', required: false })
    @IsOptional()
    isMajor?: boolean;

    @ApiProperty({ type: [CreateSubjectPartDto], required: false })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSubjectPartDto)
    parts?: CreateSubjectPartDto[];
}
