import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RejectEnrollmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  enrollmentId: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  reason?: string;
}
