import { IsString, IsNotEmpty, IsObject, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterFaceDto {
  @ApiProperty({ example: 'STU12345', required: false })
  @IsString()
  @IsOptional()
  studentId?: string;

  @ApiProperty({ example: { center: '...' } })
  @IsObject()
  encryptedImages: Record<string, string>; // HeadPose -> Base64 encrypted image

  @ApiProperty({ example: true })
  @IsBoolean()
  isEncrypted: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  imageHashes?: Record<string, string>; // Optional hash verification
}
