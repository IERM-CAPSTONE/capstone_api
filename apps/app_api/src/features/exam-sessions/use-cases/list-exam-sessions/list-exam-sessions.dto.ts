import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListExamSessionsDto {
    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    page?: number;

    @ApiProperty({ required: false, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    limit?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    subjectCode?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    examCode?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    date?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    time?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    fromDate?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    toDate?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    startTime?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    endTime?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    examRoomId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    proctorId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    studentId?: string;

    @ApiProperty({ required: false, enum: ['HCM', 'HN', 'DN', 'QN', 'CT'] })
    @IsOptional()
    @IsString()
    campus?: string;

    @ApiProperty({ required: false, enum: ['PE', 'FE', 'TE', 'RE'] })
    @IsOptional()
    @IsString()
    examType?: string;
}
