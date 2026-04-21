import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsDateString } from 'class-validator';

export class UpdateStudentExamPartDto {
    @ApiProperty({ example: true, description: 'Student checked in for this part', required: false })
    @IsOptional()
    @IsBoolean()
    isCheckedIn?: boolean;

    @ApiProperty({ example: '2026-03-20T08:45:00.000Z', required: false, nullable: true })
    @IsOptional()
    @IsDateString()
    checkInTime?: string | null;

    @ApiProperty({ example: true, description: 'Student submitted for this part', required: false })
    @IsOptional()
    @IsBoolean()
    isSubmit?: boolean;

    @ApiProperty({ example: '2026-03-20T10:10:00.000Z', required: false, nullable: true })
    @IsOptional()
    @IsDateString()
    submitTime?: string | null;

    @ApiProperty({ example: true, description: 'Student signed for this part', required: false })
    @IsOptional()
    @IsBoolean()
    isSign?: boolean;

    @ApiProperty({ example: '2026-03-20T10:05:00.000Z', required: false, nullable: true })
    @IsOptional()
    @IsDateString()
    signTime?: string | null;
}
