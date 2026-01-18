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
    subjectCode?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    examRoomId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    proctorId?: string;
}
