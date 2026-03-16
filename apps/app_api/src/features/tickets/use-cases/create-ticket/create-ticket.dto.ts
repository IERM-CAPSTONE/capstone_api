import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum IssueTypeEnum {
    ACADEMIC_VIOLATION = 'Academic Violation',
    TECHNICAL_ISSUE = 'Technical Issue',
    ROOM_MANAGEMENT = 'Room Management',
    FACE_MISMATCH = 'Face Mismatch',
}

export enum PriorityEnum {
    LOW = 'Low',
    MEDIUM = 'Medium',
    HIGH = 'High',
    URGENT = 'Urgent',
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

    @ApiPropertyOptional({ enum: PriorityEnum, default: PriorityEnum.MEDIUM })
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
}
