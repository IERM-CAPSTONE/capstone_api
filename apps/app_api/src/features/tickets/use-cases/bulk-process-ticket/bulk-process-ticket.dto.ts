import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, ArrayNotEmpty } from 'class-validator';

export enum BulkProcessAction {
    RESOLVE = 'resolve',
    ASSIGN = 'assign',
}

export class BulkProcessTicketDto {
    @ApiProperty({ type: [String], description: 'Array of ticket IDs to process' })
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    ticketIds: string[];

    @ApiProperty({ enum: BulkProcessAction, description: '"resolve" or "assign"' })
    @IsEnum(BulkProcessAction)
    action: BulkProcessAction;

    @ApiProperty({ example: 'Student verified. IT notified. Issue resolved.' })
    @IsString()
    resolveNote: string;

    @ApiPropertyOptional({ description: 'Required when action is "assign"' })
    @IsOptional()
    @IsString()
    assigneeId?: string;
}
