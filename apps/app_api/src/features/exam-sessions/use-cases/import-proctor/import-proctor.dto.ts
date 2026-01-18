import { IsArray, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ProctorItemDto {
    @IsString()
    dateExam: string;

    @IsString()
    timeExam: string;

    @IsString()
    examRoom: string;

    @IsString()
    proctorEmail: string;

    @IsOptional()
    @IsString()
    proctorType?: string;
}

export class ImportProctorDto {
    @IsEnum(['proctor'])
    importType: 'proctor';

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProctorItemDto)
    proctors: ProctorItemDto[];

    @IsOptional()
    @IsString()
    batchId?: string;

    @IsOptional()
    @IsNumber()
    totalItems?: number;
}
