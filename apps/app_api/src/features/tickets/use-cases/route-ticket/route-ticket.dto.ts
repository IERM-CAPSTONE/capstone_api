import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class RouteTicketDto {
    @ApiProperty({ enum: ['HALL_INVIGILATOR', 'EXAM_OFFICER', 'IT_SUPPORT'] })
    @IsString()
    @IsIn(['HALL_INVIGILATOR', 'EXAM_OFFICER', 'IT_SUPPORT'])
    targetRole: 'HALL_INVIGILATOR' | 'EXAM_OFFICER' | 'IT_SUPPORT';

    @ApiPropertyOptional({ example: 'Need technical verification in room 307.' })
    @IsOptional()
    @IsString()
    reason?: string | null;
}
