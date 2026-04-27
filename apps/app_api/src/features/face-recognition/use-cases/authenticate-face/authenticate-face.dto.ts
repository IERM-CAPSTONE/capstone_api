import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthenticateFaceDto {
  @ApiProperty({ example: 'BASE64_IMAGE_DATA' })
  @IsString()
  @IsNotEmpty()
  image: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  isEncrypted: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  imageHash?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  examSessionId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  examPartCode?: string;

  @ApiProperty({
    required: false,
    type: [String],
    description: 'Multiple frames for attendance recognition',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiProperty({
    required: false,
    description: 'Expected student UUID for 1:1 face verification',
  })
  @IsOptional()
  @IsString()
  expectedStudentId?: string;

  @ApiProperty({
    required: false,
    description: 'Physical seat id for proctor-driven check-in',
  })
  @IsOptional()
  @IsString()
  seatPosition?: string;
}
