import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsUUID, IsEnum, IsArray } from 'class-validator';

export class CreateExamSessionDto {
    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsUUID()
    examRoomId?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsUUID()
    proctorId?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsUUID()
    hallInvigilatorId?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsString()
    subjectCode?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsDateString()
    examOpenTime?: Date | null;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsDateString()
    examCloseTime?: Date | null;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsString()
    examCode?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsString()
    openCode?: string | null;

    @ApiProperty({ required: false, nullable: true, type: [String] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    examType?: string[];

    @ApiProperty({ example: 'Scheduled', enum: ['Ongoing', 'Ended', 'Scheduled'], description: 'Session status', required: false })
    @IsOptional()
    @IsEnum(['Ongoing', 'Ended', 'Scheduled'])
    status?: string;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsString()
    semester?: string | null;

    @ApiProperty({ required: false, nullable: true })
    @IsOptional()
    @IsString()
    note?: string | null;
}
