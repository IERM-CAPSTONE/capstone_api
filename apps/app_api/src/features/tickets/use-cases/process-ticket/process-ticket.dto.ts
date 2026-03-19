import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';

export enum ProcessAction {
    RESOLVE = 'resolve',
    ASSIGN = 'assign',
}

export class ProcessTicketDto {
    @ApiProperty({ enum: ProcessAction, description: '"resolve" to close with note, "assign" to delegate to staff' })
    @IsEnum(ProcessAction)
    action: ProcessAction;

    @ApiProperty({ example: 'Student identity verified. Verbal warning issued.' })
    @IsString()
    resolveNote: string;

    @ApiPropertyOptional({ example: 'uuid-of-it-support-user', description: 'Required when action is "assign"' })
    @IsOptional()
    @IsString()
    assigneeId?: string;
}
