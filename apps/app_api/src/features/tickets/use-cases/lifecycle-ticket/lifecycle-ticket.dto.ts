import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class LifecycleTicketDto {
    @ApiProperty({ enum: ['START', 'REOPEN', 'ACKNOWLEDGE', 'CLOSE'] })
    @IsString()
    @IsIn(['START', 'REOPEN', 'ACKNOWLEDGE', 'CLOSE'])
    action: 'START' | 'REOPEN' | 'ACKNOWLEDGE' | 'CLOSE';

    @ApiPropertyOptional({ example: 'Reporter confirmed the final response.' })
    @IsOptional()
    @IsString()
    note?: string | null;
}
