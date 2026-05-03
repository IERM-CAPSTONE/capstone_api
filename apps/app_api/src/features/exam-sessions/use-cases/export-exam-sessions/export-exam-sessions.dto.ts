import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ExportExamSessionsDto {
    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    semesterId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    campus?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    examType?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    subjectCode?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    status?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    examRoomId?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    fromDate?: string;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsString()
    toDate?: string;
}
