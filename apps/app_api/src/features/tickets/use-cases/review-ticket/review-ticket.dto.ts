import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { IssueTypeEnum } from '../create-ticket/create-ticket.dto';

export enum AiTrainingStatusEnum {
    PENDING_REVIEW = 'PENDING_REVIEW',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export class ReviewTicketDto {
    @ApiProperty({ enum: AiTrainingStatusEnum, description: 'Review decision for AI training eligibility' })
    @IsEnum(AiTrainingStatusEnum)
    aiTrainingStatus: AiTrainingStatusEnum;

    @ApiPropertyOptional({ example: 'cannotLogin', description: 'Standardized final issue code after review' })
    @IsOptional()
    @IsString()
    finalIssueName?: string;

    @ApiPropertyOptional({ enum: IssueTypeEnum, description: 'Standardized issue type after review' })
    @IsOptional()
    @IsEnum(IssueTypeEnum)
    finalIssueType?: IssueTypeEnum;

    @ApiPropertyOptional({ example: 'RESET_PASSWORD_GUIDE', description: 'Standardized resolution code after review' })
    @IsOptional()
    @IsString()
    resolutionCode?: string;

    @ApiPropertyOptional({ example: 'Đã hướng dẫn reset thông tin đăng nhập và xác nhận truy cập được hệ thống thi.' })
    @IsOptional()
    @IsString()
    resolutionStandardText?: string;

    @ApiPropertyOptional({ example: 'Đã map case custom về taxonomy chuẩn cannotLogin.' })
    @IsOptional()
    @IsString()
    reviewNote?: string;
}
