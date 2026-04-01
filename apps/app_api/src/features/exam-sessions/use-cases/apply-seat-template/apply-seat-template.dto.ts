import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum SeatTemplateType {
    U_SHAPE = 'U_SHAPE',
    L_LEFT = 'L_LEFT',
    L_RIGHT = 'L_RIGHT',
    O_SHAPE = 'O_SHAPE',
    GAP_PATTERN = 'GAP_PATTERN',
    ALTERNATE_ROWS = 'ALTERNATE_ROWS',
}

export class ApplySeatTemplateDto {
    @ApiProperty({ enum: SeatTemplateType })
    @IsEnum(SeatTemplateType)
    templateType: SeatTemplateType;

    @ApiPropertyOptional({
        description: 'Gap value used only for GAP_PATTERN (e.g. 2 means lock every second seat by checkerboard logic)',
        minimum: 1,
        maximum: 6,
        default: 2,
    })
    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(6)
    gap?: number;
}
