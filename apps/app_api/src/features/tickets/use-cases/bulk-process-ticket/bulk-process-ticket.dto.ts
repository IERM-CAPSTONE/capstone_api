import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString, ArrayNotEmpty } from 'class-validator';

export enum BulkProcessAction {
    ASSIGN = 'assign',
    CHANGE_STATUS = 'change_status',
    RESOLVE = 'resolve',
}

export class BulkProcessTicketDto {
    @ApiProperty({ type: [String], description: 'Array of ticket IDs to process' })
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    ticketIds: string[];

    @ApiProperty({ enum: BulkProcessAction, description: '"assign" or "change_status"' })
    @IsEnum(BulkProcessAction)
    action: BulkProcessAction;

    @ApiPropertyOptional({ example: 'Đổi trạng thái hàng loạt theo yêu cầu vận hành.' })
    @IsOptional()
    @IsString()
    note?: string;

    @ApiPropertyOptional({ example: 'Legacy resolve note for backward compatibility' })
    @IsOptional()
    @IsString()
    resolveNote?: string;

    @ApiPropertyOptional({ description: 'Required when action is "assign"' })
    @IsOptional()
    @IsString()
    assigneeId?: string;

    @ApiPropertyOptional({ example: 'IN_PROGRESS', description: 'Required when action is "change_status"' })
    @IsOptional()
    @IsString()
    status?: string;
}
