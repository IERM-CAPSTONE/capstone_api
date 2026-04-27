import { ApiPropertyOptional } from '@nestjs/swagger';
import { AttendanceActorType, AttendanceSnapshotStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class ListAttendanceSnapshotsDto {
  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  examSessionId?: string;

  @ApiPropertyOptional({ enum: AttendanceSnapshotStatus })
  @IsOptional()
  @IsEnum(AttendanceSnapshotStatus)
  status?: AttendanceSnapshotStatus;

  @ApiPropertyOptional({ enum: AttendanceActorType })
  @IsOptional()
  @IsEnum(AttendanceActorType)
  actorType?: AttendanceActorType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  matchedUserId?: string;

  @ApiPropertyOptional({ description: 'ISO date string' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'ISO date string' })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}
