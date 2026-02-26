import { IsArray, IsEnum, IsNumber, IsOptional, IsString, Matches, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ScheduleItemDto {
    @IsOptional()
    @IsString()
    examCode?: string | null;

    @IsOptional()
    @IsString()
    openCode?: string | null;

    @IsString()
    subjectCode: string;

    @IsString()
    examDate: string;

    @IsString()
    startTime: string;

    @IsString()
    endTime: string;

    @IsString()
    room: string;

    @IsString()
    examSession: string;

    @IsOptional()
    @IsString()
    examType?: string;
}

export class StudentItemDto {
    @IsOptional()
    @IsNumber()
    stt?: number | null;

    @IsString()
    studentCode: string;

    @IsString()
    name: string;

    @IsString()
    @Transform(({ value }) => value?.trim())
    email?: string | null;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.toLowerCase().trim())
    username?: string | null;

    @IsOptional()
    @IsString()
    memberCode?: string | null;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === null || value === undefined) return undefined;
        const normalized = String(value).trim();
        return normalized.length ? normalized : undefined;
    })
    @Matches(/^\d{12}$/, { message: 'CCCD must contain exactly 12 digits' })
    cccd?: string;

    @IsOptional()
    @IsString()
    examSession?: string | null;

    @IsString()
    subjectCode: string;

    @IsString()
    examPart: string;
}

export class ImportScheduleDto {
    @IsEnum(['schedule'])
    importType: 'schedule';

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ScheduleItemDto)
    schedules: ScheduleItemDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => StudentItemDto)
    students: StudentItemDto[];

    @IsOptional()
    @IsString()
    batchId?: string;

    @IsOptional()
    @IsNumber()
    totalItems?: number;
}
