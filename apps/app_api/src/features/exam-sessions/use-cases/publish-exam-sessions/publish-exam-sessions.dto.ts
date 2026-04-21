import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class PublishExamSessionsDto {
    @ApiProperty({ example: ['uuid-1', 'uuid-2'], description: 'List of exam session IDs to publish', required: false })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true })
    sessionIds?: string[];

    @ApiProperty({ example: 'uuid-semester', description: 'Semester ID to publish all draft sessions', required: false })
    @IsOptional()
    @IsUUID()
    semesterId?: string;

    @ApiProperty({ example: 'HCM', description: 'Campus to publish all draft sessions', required: false })
    @IsOptional()
    @IsString()
    campus?: string;
}
