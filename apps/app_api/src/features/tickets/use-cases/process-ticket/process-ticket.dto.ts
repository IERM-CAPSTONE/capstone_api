import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { IssueTypeEnum } from '../create-ticket/create-ticket.dto';
import { IssueStatus } from '@prisma/client';

export enum ProcessAction {
    ASSIGN  = 'assign',
    REASSIGN = 'reassign',
    CHANGE_STATUS = 'change_status',
    RESOLVE = 'resolve',
    START = 'start',
}

export class ProcessTicketDto {
    @ApiProperty({ enum: ProcessAction, description: '"assign/reassign" to delegate, "change_status" to update workflow status' })
    @IsEnum(ProcessAction)
    action: ProcessAction;

    @ApiPropertyOptional({ example: 'Need IT to verify EOS client and network status at room 307.' })
    @IsOptional()
    @IsString()
    note?: string;

    @ApiPropertyOptional({ example: 'Legacy resolve note for backward compatibility' })
    @IsOptional()
    @IsString()
    resolveNote?: string;

    @ApiPropertyOptional({ example: 'uuid-of-it-support-user', description: 'Required when action is "assign" or "reassign"' })
    @IsOptional()
    @IsString()
    assigneeId?: string;

    @ApiPropertyOptional({ enum: IssueStatus, description: 'Required when action is "change_status"' })
    @IsOptional()
    @IsEnum(IssueStatus)
    status?: IssueStatus;

    @ApiPropertyOptional({ example: 'needReassign', description: 'Final confirmed issue name after human review' })
    @IsOptional()
    @IsString()
    finalIssueName?: string;

    @ApiPropertyOptional({ enum: IssueTypeEnum, description: 'Final confirmed issue type after human review' })
    @IsOptional()
    @IsEnum(IssueTypeEnum)
    finalIssueType?: IssueTypeEnum;

    @ApiPropertyOptional({ example: 'REASSIGN_ACCOUNT', description: 'Normalized resolution action code selected by staff' })
    @IsOptional()
    @IsString()
    resolutionCode?: string;

    @ApiPropertyOptional({ example: 'Lỗi hiển thị sai tên môn thi', description: 'Custom issue text when finalIssueName is OTHER' })
    @IsOptional()
    @IsString()
    finalIssueCustomText?: string;

    @ApiPropertyOptional({ example: 'Đính chính dữ liệu hiển thị', description: 'Custom resolution text when resolutionCode is CUSTOM' })
    @IsOptional()
    @IsString()
    resolutionCustomText?: string;

    @ApiPropertyOptional({ example: 'Đã xác nhận tài khoản cần re-assign và chuyển xử lý theo đúng quy trình.' })
    @IsOptional()
    @IsString()
    resolutionStandardText?: string;
}
