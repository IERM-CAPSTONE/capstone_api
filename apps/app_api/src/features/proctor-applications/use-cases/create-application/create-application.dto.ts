import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProctorApplicationDto {
    @ApiProperty({ example: 'source-session-uuid', description: 'Current assigned exam session ID of requester' })
    @IsString()
    @IsNotEmpty()
    examSessionId: string;

    @ApiProperty({ example: 'target-session-uuid', description: 'Target exam session ID to swap with' })
    @IsString()
    @IsNotEmpty()
    targetExamSessionId: string;

    @ApiProperty({ example: 'MORNING', enum: ['MORNING', 'AFTERNOON'], description: 'Shift of the swap session' })
    @IsEnum(['MORNING', 'AFTERNOON'])
    @IsNotEmpty()
    preferredShift: string;

    @ApiProperty({ example: 'ROOM', enum: ['ROOM'], description: 'Swap type' })
    @IsEnum(['ROOM'])
    @IsNotEmpty()
    preferredType: string;

    @ApiProperty({ example: '2026-02-15T00:00:00.000Z', description: 'Swap date', required: false, nullable: true })
    @IsOptional()
    @IsDateString()
    preferredDate?: Date | null;

    @ApiProperty({ example: 'Can we swap? I have a conflict.', description: 'Swap request note', required: false, nullable: true })
    @IsOptional()
    @IsString()
    notes?: string | null;
}
