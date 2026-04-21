import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class MonitorActivitiesQueryDto {
    @ApiPropertyOptional({ description: 'Number of activities to return', default: 50, minimum: 1, maximum: 200 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(200)
    limit?: number = 50;
}

export interface SessionActivityItem {
    id: string;
    activityType: string;
    event: string;
    title: string;
    message: string;
    ticketId: string;
    createdAt: Date;
    meta?: Record<string, any>;
}
