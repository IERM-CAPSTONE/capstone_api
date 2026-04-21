import { IsString, IsNotEmpty, IsEnum, IsUUID, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AnnouncementType {
  INFO = 'INFO',
  WARNING = 'WARNING',
  URGENT = 'URGENT',
}

export enum Campus {
  HCM = 'HCM',
  HN = 'HN',
  DN = 'DN',
  QN = 'QN',
  CT = 'CT',
}

export class CreateTemplateDto {
    @ApiProperty({ example: 'Time Warning: 15m' })
    @IsString()
    @IsNotEmpty()
    title: string;
    
    @ApiProperty({ example: 'Attention all students, you have 15 minutes left until the end of the exam.' })
    @IsString()
    @IsNotEmpty()
    content: string;
    
    @ApiProperty({ enum: AnnouncementType, default: 'INFO' })
    @IsEnum(AnnouncementType)
    type: AnnouncementType;

    @ApiProperty({ enum: Campus, required: false })
    @IsEnum(Campus)
    @IsOptional()
    campus?: Campus;
}

export class UpdateTemplateDto {
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    title?: string;
    
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    content?: string;
    
    @ApiProperty({ enum: AnnouncementType, required: false })
    @IsEnum(AnnouncementType)
    @IsOptional()
    type?: AnnouncementType;

    @ApiProperty({ enum: Campus, required: false })
    @IsEnum(Campus)
    @IsOptional()
    campus?: Campus;
}

export class BroadcastAnnouncementDto {
    @ApiProperty({ example: ['IT101', 'MA201'] })
    @IsArray()
    @IsString({ each: true })
    subjectCodes: string[];
    
    @ApiProperty({ example: 'This is a broadcast message.' })
    @IsString()
    @IsNotEmpty()
    content: string;
    
    @ApiProperty({ enum: AnnouncementType, default: 'INFO' })
    @IsEnum(AnnouncementType)
    type: AnnouncementType;
    
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    title?: string;
}
