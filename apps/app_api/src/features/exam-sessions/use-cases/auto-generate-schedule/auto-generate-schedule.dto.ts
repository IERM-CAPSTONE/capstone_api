import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CampusFileDto {
    @ApiProperty() @IsString() campus: string;
    @ApiProperty() @IsString() fileData: string;
}

/**
 * Auto-Generate Schedule - Request DTO
 */
export class AutoGenerateScheduleDto {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'Semester ID' })
    @IsUUID()
    semesterId: string;

    @ApiProperty({ example: ['HCM'], enum: ['HCM', 'HN', 'DN', 'QN', 'CT'], isArray: true })
    @IsArray()
    @IsEnum(['HCM', 'HN', 'DN', 'QN', 'CT'], { each: true })
    @IsString({ each: true })
    campus: string[];

    @ApiProperty({ example: 11, description: 'Normal Final exam week (Optional)', required: false })
    @IsNumber() @Min(1) @IsOptional()
    finalWeek?: number;

    @ApiProperty({ example: 12, description: 'Normal Retake exam week (Optional)', required: false })
    @IsNumber() @Min(1) @IsOptional()
    retakeWeek?: number;

    @ApiProperty({ example: 9, description: 'PE / Practical exam week (Optional)', required: false })
    @IsNumber() @Min(1) @IsOptional()
    practicalWeek?: number;

    @ApiProperty({ example: 10, description: 'Coursera FE week (Optional, defaults to finalWeek)', required: false })
    @IsNumber() @Min(1) @IsOptional()
    courseraWeek?: number;

    @ApiProperty({ example: 13, description: 'Coursera Retake week (Optional, defaults to retakeWeek)', required: false })
    @IsNumber() @Min(1) @IsOptional()
    courseraRetakeWeek?: number;

    @ApiProperty({ example: [], description: 'List of selected room IDs' })
    @IsArray() @IsUUID('4', { each: true })
    roomIds: string[];

    @ApiProperty({ description: 'Base64 encoded CSV (legacy single-campus)', required: false })
    @IsString() @IsOptional()
    fileData?: string;

    @ApiProperty({ type: [CampusFileDto], description: 'Per-campus student registration files', required: false })
    @IsArray() @ValidateNested({ each: true }) @Type(() => CampusFileDto) @IsOptional()
    campusFiles?: CampusFileDto[];

    @ApiProperty({ type: [CampusFileDto], description: 'Per-campus student class schedule files', required: false })
    @IsArray() @ValidateNested({ each: true }) @Type(() => CampusFileDto) @IsOptional()
    classScheduleFiles?: CampusFileDto[];

    @ApiProperty({ example: 6, description: 'Number of exam days in a week (6 or 7)', required: false })
    @IsNumber() @IsOptional()
    examDays?: number;
}
