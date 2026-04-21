import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SearchAuditLogDto {
  @ApiProperty({
    example: 'SE140001',
    description: 'Student code or email used to search related tickets and attendance snapshots',
  })
  @IsString()
  @MinLength(1)
  keyword: string;
}
