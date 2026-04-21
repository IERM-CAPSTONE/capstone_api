import { IsString, IsOptional, IsEnum } from 'class-validator';

export class GetExamSeatsBySessionDto {
  @IsString()
  sessionId: string;

  @IsOptional()
  @IsEnum(['Available', 'Locked', 'Assigned', 'Present', 'Absent'])
  status?: 'Available' | 'Locked' | 'Assigned' | 'Present' | 'Absent';
}
