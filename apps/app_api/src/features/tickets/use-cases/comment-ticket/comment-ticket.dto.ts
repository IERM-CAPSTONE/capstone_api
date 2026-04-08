import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CommentTicketDto {
    @ApiProperty({ example: 'Đã kiểm tra hiện trạng và chờ phản hồi từ khảo thí.' })
    @IsString()
    content: string;

    @ApiPropertyOptional({
        example: true,
        description: 'Whether this structured comment should update AI training fields on the ticket',
    })
    @IsOptional()
    @IsBoolean()
    useForAiTraining?: boolean;

    @ApiPropertyOptional({ example: 'cannotLogin' })
    @IsOptional()
    @IsString()
    finalIssueName?: string;

    @ApiPropertyOptional({ example: 'Technical Issue' })
    @IsOptional()
    @IsString()
    finalIssueType?: string;

    @ApiPropertyOptional({
        example: 'Lỗi đăng nhập bằng tài khoản dự phòng',
        description: 'Custom issue text when finalIssueName is OTHER',
    })
    @IsOptional()
    @IsString()
    finalIssueCustomText?: string;

    @ApiPropertyOptional({ example: 'RESET_PASSWORD_GUIDE' })
    @IsOptional()
    @IsString()
    resolutionCode?: string;

    @ApiPropertyOptional({
        example: 'Đã đồng bộ lại phiên đăng nhập',
        description: 'Custom resolution text when resolutionCode is CUSTOM',
    })
    @IsOptional()
    @IsString()
    resolutionCustomText?: string;

    @ApiPropertyOptional({ example: 'Đã hướng dẫn người dùng đặt lại mật khẩu.' })
    @IsOptional()
    @IsString()
    resolutionStandardText?: string;
}
