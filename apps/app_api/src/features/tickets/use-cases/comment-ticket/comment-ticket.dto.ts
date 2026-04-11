import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';

export class CommentTicketDto {
    @ApiPropertyOptional({ enum: ['DISCUSSION', 'CONCLUSION', 'RESOLUTION'] })
    @IsOptional()
    @IsString()
    @IsIn(['DISCUSSION', 'CONCLUSION', 'RESOLUTION'])
    mode?: 'DISCUSSION' | 'CONCLUSION' | 'RESOLUTION';

    @ApiProperty({ example: 'Da kiem tra hien trang va dang xu ly.' })
    @IsString()
    body: string;

    @ApiPropertyOptional({ example: 'Legacy alias for body' })
    @IsOptional()
    @IsString()
    content?: string;

    @ApiPropertyOptional({ example: 'cannotLogin' })
    @IsOptional()
    @IsString()
    issueCode?: string;

    @ApiPropertyOptional({ example: 'Technical Issue' })
    @IsOptional()
    @IsString()
    issueType?: string;

    @ApiPropertyOptional({ example: 'Custom issue text when issueCode is OTHER' })
    @IsOptional()
    @IsString()
    issueCustomText?: string;

    @ApiPropertyOptional({ example: 'RESET_PASSWORD_GUIDE' })
    @IsOptional()
    @IsString()
    resolutionCode?: string;

    @ApiPropertyOptional({ example: 'Custom resolution text when resolutionCode is CUSTOM' })
    @IsOptional()
    @IsString()
    resolutionCustomText?: string;

    @ApiPropertyOptional({ example: 'Da huong dan nguoi dung dat lai mat khau.' })
    @IsOptional()
    @IsString()
    responseText?: string;

    @ApiPropertyOptional({ example: 'Dong bo lai phien dang nhap tren may tram.' })
    @IsOptional()
    @IsString()
    techNote?: string;

    @ApiPropertyOptional({ example: true, description: 'Only used for CONCLUSION mode' })
    @IsOptional()
    @IsBoolean()
    useForAiTraining?: boolean;

    @ApiPropertyOptional({ example: 'Legacy alias for issueCode' })
    @IsOptional()
    @IsString()
    finalIssueName?: string;

    @ApiPropertyOptional({ example: 'Legacy alias for issueType' })
    @IsOptional()
    @IsString()
    finalIssueType?: string;

    @ApiPropertyOptional({ example: 'Legacy alias for issueCustomText' })
    @IsOptional()
    @IsString()
    finalIssueCustomText?: string;

    @ApiPropertyOptional({ example: 'Legacy alias for responseText' })
    @IsOptional()
    @IsString()
    resolutionStandardText?: string;
}
