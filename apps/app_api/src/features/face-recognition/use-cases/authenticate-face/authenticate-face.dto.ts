import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';
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
}
