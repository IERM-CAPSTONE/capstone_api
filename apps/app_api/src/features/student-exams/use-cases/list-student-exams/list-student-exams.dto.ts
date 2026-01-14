import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsString, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class ListStudentExamsDto {
    @ApiProperty({ required: false, default: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiProperty({ required: false, default: 10 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;

    @ApiProperty({ required: false, description: 'Filter by exam session ID' })
    @IsOptional()
    @IsString()
    examSessionId?: string;

    @ApiProperty({ required: false, description: 'Filter by student ID' })
    @IsOptional()
    @IsString()
    studentId?: string;

    @ApiProperty({ required: false, enum: ['REGISTERED', 'CHECKEDIN', 'CHECKEDOUT', 'MOVED', 'REMOVED'] })
    @IsOptional()
    @IsEnum(['REGISTERED', 'CHECKEDIN', 'CHECKEDOUT', 'MOVED', 'REMOVED'])
    status?: string;
}
