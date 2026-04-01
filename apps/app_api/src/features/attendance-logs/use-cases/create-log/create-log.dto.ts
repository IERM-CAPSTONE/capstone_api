import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';

export class CreateAttendanceLogDto {
    @ApiProperty({ example: 12345, description: 'UID', required: false })
    @IsOptional()
    @IsNumber()
    uid?: number;

    @ApiProperty({ example: 'user-uuid', description: 'Student User ID', required: false })
    @IsOptional()
    @IsString()
    studentId?: string;

    @ApiProperty({ example: 'SE123456', description: 'Student Code', required: false })
    @IsOptional()
    @IsString()
    studentCode?: string;

    @ApiProperty({ example: 'Nguyen Van A', description: 'Student Name', required: false })
    @IsOptional()
    @IsString()
    studentName?: string;

    @ApiProperty({ example: 'session-uuid', description: 'Exam Session ID', required: false })
    @IsOptional()
    @IsString()
    examSessionId?: string;

    @ApiProperty({ example: 'success', description: 'Attendance Status' })
    @IsNotEmpty()
    @IsString()
    status: string;

    @ApiProperty({ example: 0.95, description: 'Confidence Score', required: false })
    @IsOptional()
    @IsNumber()
    confidence?: number;

    @ApiProperty({ example: true, description: 'Is Correct Room', required: false })
    @IsOptional()
    @IsBoolean()
    isCorrectRoom?: boolean;

    @ApiProperty({ example: 'Success message', description: 'Optional message', required: false })
    @IsOptional()
    @IsString()
    message?: string;

    @ApiProperty({ example: 'device-uuid', description: 'Device ID', required: false })
    @IsOptional()
    @IsString()
    deviceId?: string;
}
