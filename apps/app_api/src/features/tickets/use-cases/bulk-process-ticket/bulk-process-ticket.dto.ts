import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class BulkProcessTicketDto {
    @ApiProperty({ type: [String] })
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    ticketIds: string[];

    @ApiProperty({
        enum: ['COMMENT', 'ROUTE', 'LIFECYCLE', 'assign', 'change_status', 'resolve'],
    })
    @IsString()
    @IsIn(['COMMENT', 'ROUTE', 'LIFECYCLE', 'assign', 'change_status', 'resolve'])
    action: 'COMMENT' | 'ROUTE' | 'LIFECYCLE' | 'assign' | 'change_status' | 'resolve';

    @ApiPropertyOptional({ enum: ['DISCUSSION', 'CONCLUSION', 'RESOLUTION'] })
    @IsOptional()
    @IsString()
    mode?: 'DISCUSSION' | 'CONCLUSION' | 'RESOLUTION';

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    body?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    issueCode?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    issueType?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    issueCustomText?: string | null;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    resolutionCode?: string | null;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    resolutionCustomText?: string | null;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    responseText?: string | null;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    techNote?: string | null;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    useForAiTraining?: boolean;

    @ApiPropertyOptional({ enum: ['PROCTOR', 'HALL_INVIGILATOR', 'EXAM_OFFICER', 'IT_SUPPORT'] })
    @IsOptional()
    @IsString()
    targetRole?: 'PROCTOR' | 'HALL_INVIGILATOR' | 'EXAM_OFFICER' | 'IT_SUPPORT';

    @ApiPropertyOptional({ enum: ['START', 'REOPEN', 'ACKNOWLEDGE', 'CLOSE'] })
    @IsOptional()
    @IsString()
    lifecycleAction?: 'START' | 'REOPEN' | 'ACKNOWLEDGE' | 'CLOSE';

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    note?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    assigneeId?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    status?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    resolveNote?: string;
}
