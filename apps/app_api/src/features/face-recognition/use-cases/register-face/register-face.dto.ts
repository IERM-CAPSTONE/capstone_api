import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsBoolean,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum FaceImageRetentionPolicy {
  SHORT_TERM_14_DAYS = 'SHORT_TERM_14_DAYS',
  UNTIL_GRADUATION = 'UNTIL_GRADUATION',
}

export class RegisterFaceDto {
  @ApiProperty({ example: 'STU12345', required: false })
  @IsString()
  @IsOptional()
  studentId?: string;

  @ApiProperty({ example: 'SE123456', required: false })
  @IsString()
  @IsOptional()
  studentCode?: string;

  @ApiProperty({ example: { center: '...' } })
  @IsObject()
  encryptedImages: Record<string, string>;

  @ApiProperty({ example: true })
  @IsBoolean()
  isEncrypted: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  imageHashes?: Record<string, string>;

  @ApiProperty({ example: '123456', required: false })
  @IsString()
  @IsOptional()
  otp?: string;

  @ApiProperty({ enum: FaceImageRetentionPolicy, required: false })
  @IsEnum(FaceImageRetentionPolicy)
  @IsOptional()
  retentionPolicy?: FaceImageRetentionPolicy;
}
