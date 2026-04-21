import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class ProctorCheckInDto {
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

  @ApiProperty()
  @IsUUID()
  examSessionId: string;
}
