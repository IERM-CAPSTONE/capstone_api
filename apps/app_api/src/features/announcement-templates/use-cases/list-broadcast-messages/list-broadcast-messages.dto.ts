import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListBroadcastMessagesQueryDto {
    @ApiPropertyOptional({
        description: 'Comma-separated subject codes to filter messages',
        example: 'CSI302,PRN211',
    })
    @IsOptional()
    @IsString()
    subjectCodes?: string;

    @ApiPropertyOptional({ description: 'Max number of messages', default: 50, minimum: 1, maximum: 200 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(200)
    limit?: number = 50;
}

export interface BroadcastMessageItem {
    id: string;
    title: string;
    content: string;
    type: string;
    createdAt: Date;
    senderName?: string | null;
    subjectCodes: string[];
    deliveries: Array<{
        sessionId: string;
        subjectCode: string;
        roomNumber: string;
        campus: string;
    }>;
}
