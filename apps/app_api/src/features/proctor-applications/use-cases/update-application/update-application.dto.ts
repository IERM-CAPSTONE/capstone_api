import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateProctorApplicationDto {
    @ApiProperty({ example: 'source-session-uuid', description: 'Current assigned exam session ID of requester', required: false })
    @IsOptional()
    @IsString()
    examSessionId?: string | null;

    @ApiProperty({ example: 'target-session-uuid', description: 'Target exam session ID to swap with', required: false })
    @IsOptional()
    @IsString()
    targetExamSessionId?: string | null;

    @ApiProperty({ example: 'MORNING', enum: ['MORNING', 'AFTERNOON'], description: 'Shift of the swap session', required: false })
    @IsOptional()
    @IsEnum(['MORNING', 'AFTERNOON'])
    preferredShift?: string;

    @ApiProperty({ example: 'ROOM', enum: ['ROOM', 'HALL'], description: 'Swap type', required: false })
    @IsOptional()
    @IsEnum(['ROOM', 'HALL'])
    preferredType?: string;

    @ApiProperty({ example: '2026-02-15T00:00:00.000Z', description: 'Swap date', required: false, nullable: true })
    @IsOptional()
    @IsDateString()
    preferredDate?: Date | null;

    @ApiProperty({ example: 'Updated swap note', description: 'Swap request note', required: false, nullable: true })
    @IsOptional()
    @IsString()
    notes?: string | null;
}
