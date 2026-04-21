import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class ReviewTicketDto {
    @ApiProperty({ enum: ['APPROVED', 'REJECTED'] })
    @IsString()
    @IsIn(['APPROVED', 'REJECTED'])
    decision: 'APPROVED' | 'REJECTED';

    @ApiPropertyOptional({ example: 'cannotLogin' })
    @IsOptional()
    @IsString()
    finalIssueName?: string | null;

    @ApiPropertyOptional({ example: 'Technical Issue' })
    @IsOptional()
    @IsString()
    finalIssueType?: string | null;

    @ApiPropertyOptional({ example: 'RESET_PASSWORD_GUIDE' })
    @IsOptional()
    @IsString()
    resolutionCode?: string | null;

    @ApiPropertyOptional({ example: 'Da huong dan reset thong tin dang nhap.' })
    @IsOptional()
    @IsString()
    resolutionStandardText?: string | null;

    @ApiPropertyOptional({ example: 'Mapped custom taxonomy back to standard catalog.' })
    @IsOptional()
    @IsString()
    reviewNote?: string | null;

    @ApiPropertyOptional({ example: 'Legacy alias for decision' })
    @IsOptional()
    @IsString()
    aiTrainingStatus?: string;
}
