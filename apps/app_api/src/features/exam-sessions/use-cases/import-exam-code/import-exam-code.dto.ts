import { IsArray, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class ExamCodeItemDto {
    @IsString()
    dateExam: string;

    @IsString()
    timeExam: string;

    @IsString()
    examRoom: string;

    @IsOptional()
    @IsString()
    subjectCode?: string;

    @IsOptional()
    @IsString()
    examCode?: string | null;

    @IsOptional()
    @IsString()
    openCode?: string | null;
}

export class ImportExamCodeDto {
    @IsEnum(['examcode'])
    importType: 'examcode';

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ExamCodeItemDto)
    codes: ExamCodeItemDto[];

    @IsOptional()
    @IsString()
    batchId?: string;

    @IsOptional()
    @IsNumber()
    totalItems?: number;
}
