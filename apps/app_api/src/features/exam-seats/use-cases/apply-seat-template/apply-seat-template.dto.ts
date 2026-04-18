import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, Min, ValidateNested } from 'class-validator';

export enum SeatTemplateMode {
  RESET = 'RESET',
  CHECKERBOARD = 'CHECKERBOARD',
  MANUAL = 'MANUAL',
}

export class SeatCoordinateDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  row: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  col: number;
}

export class ApplySeatTemplateDto {
  @ApiProperty({ enum: SeatTemplateMode, example: SeatTemplateMode.CHECKERBOARD })
  @IsEnum(SeatTemplateMode)
  mode: SeatTemplateMode;

  @ApiPropertyOptional({
    type: [SeatCoordinateDto],
    description: 'Required for MANUAL mode. Coordinates to set as Locked.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SeatCoordinateDto)
  lockedCoordinates?: SeatCoordinateDto[];
}
