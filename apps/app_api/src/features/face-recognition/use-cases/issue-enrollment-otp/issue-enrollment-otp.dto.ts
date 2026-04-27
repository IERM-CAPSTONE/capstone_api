import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class IssueEnrollmentOtpDto {
  @ApiProperty({ example: 'SE190312' })
  @IsString()
  @IsNotEmpty()
  studentCode: string;
}
