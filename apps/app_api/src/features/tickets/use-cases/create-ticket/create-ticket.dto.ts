import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum IssueTypeEnum {
    ACADEMIC_VIOLATION = 'Academic Violation',
    TECHNICAL_ISSUE = 'Technical Issue',
    ROOM_MANAGEMENT = 'Room Management',
    FACE_MISMATCH = 'Face Mismatch',
}

export enum PriorityEnum {
    NORMAL = 'Normal',
    URGENT = 'Urgent',
}

export enum AssignmentTypeEnum {
    HALL_INVIGILATOR = 'HALL_INVIGILATOR',
    EXAM_OFFICER = 'EXAM_OFFICER',
}

export class CreateTicketDto {
    @ApiProperty({ example: 'Suspected Cheating' })
    @IsString()
    issueName: string;

    @ApiProperty({ enum: IssueTypeEnum })
    @IsEnum(IssueTypeEnum)
    issueType: IssueTypeEnum;

    @ApiPropertyOptional({ example: "Student was looking at another student's screen." })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({ enum: PriorityEnum, default: PriorityEnum.NORMAL })
    @IsOptional()
    @IsEnum(PriorityEnum)
    priority?: PriorityEnum;

    @ApiPropertyOptional({ example: 'uuid-of-exam-session' })
    @IsOptional()
    @IsString()
    sessionId?: string;

    @ApiPropertyOptional({ example: 'https://cloudinary.com/evidence.jpg' })
    @IsOptional()
    @IsString()
    attachment?: string;

    @ApiPropertyOptional({ example: 'SE140001', description: 'MSSV of the student involved in the incident' })
    @IsOptional()
    @IsString()
    studentCode?: string;

    @ApiPropertyOptional({ example: 'Need re-assign, already registered', description: 'OCR text extracted from the attachment' })
    @IsOptional()
    @IsString()
    ocrText?: string;

    @ApiPropertyOptional({ example: 'needReassign' })
    @IsOptional()
    @IsString()
    aiPredictedIssueName?: string;

    @ApiPropertyOptional({ example: 'Technical Issue' })
    @IsOptional()
    @IsString()
    aiPredictedIssueType?: string;

    @ApiPropertyOptional({ example: 0.82 })
    @IsOptional()
    aiConfidence?: number;

    @ApiPropertyOptional({ example: 'Ảnh có dấu hiệu tài khoản đã đăng nhập trước đó và cần re-assign.' })
    @IsOptional()
    @IsString()
    aiDisplayMessage?: string;

    @ApiPropertyOptional({ example: 'need re-assign, already registered' })
    @IsOptional()
    @IsString()
    aiEvidenceText?: string;

    @ApiPropertyOptional({ example: 'text_baseline_v1' })
    @IsOptional()
    @IsString()
    aiModelVersion?: string;

    @ApiPropertyOptional({ example: 'HALL_INVIGILATOR', description: 'AI-recommended assignment type' })
    @IsOptional()
    @IsString()
    aiRecommendedAssignmentType?: string;

    @ApiPropertyOptional({ 
        enum: AssignmentTypeEnum, 
        example: AssignmentTypeEnum.HALL_INVIGILATOR,
        description: 'User-confirmed assignment type (HALL_INVIGILATOR or EXAM_OFFICER)'
    })
    @IsOptional()
    @IsEnum(AssignmentTypeEnum)
    confirmedAssignmentType?: AssignmentTypeEnum;
}
