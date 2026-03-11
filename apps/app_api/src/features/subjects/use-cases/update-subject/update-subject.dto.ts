import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateSubjectPartDto } from '../create-subject/create-subject.dto';

export class UpdateSubjectDto {
    @ApiProperty({ example: 'Java Desktop Application Updated', description: 'Subject name', required: false })
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

    @ApiProperty({ type: [CreateSubjectPartDto], required: false, description: 'Replace all parts if provided' })
    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateSubjectPartDto)
    parts?: CreateSubjectPartDto[];
}
