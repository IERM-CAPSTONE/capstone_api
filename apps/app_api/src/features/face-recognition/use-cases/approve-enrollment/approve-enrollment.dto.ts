import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class ApproveEnrollmentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  enrollmentId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  note?: string;
}
