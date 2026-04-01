import { ApiProperty } from '@nestjs/swagger';
import { AttendanceLog } from '@prisma/client';

export class AttendanceLogResponse {
    @ApiProperty({ example: 'uuid', description: 'Log ID' })
    id: string;

    @ApiProperty({ example: 12345, description: 'UID', nullable: true })
    uid: number | null;

    @ApiProperty({ example: 'user-uuid', description: 'Student User ID', nullable: true })
    studentId: string | null;

    @ApiProperty({ example: 'SE123456', description: 'Student Code', nullable: true })
    studentCode: string | null;

    @ApiProperty({ example: 'Nguyen Van A', description: 'Student Name', nullable: true })
    studentName: string | null;

    @ApiProperty({ example: 'session-uuid', description: 'Exam Session ID', nullable: true })
    examSessionId: string | null;

    @ApiProperty({ example: 'success', description: 'Attendance Status' })
    status: string;

    @ApiProperty({ example: 0.95, description: 'Confidence Score', nullable: true })
    confidence: number | null;

    @ApiProperty({ example: true, description: 'Is Correct Room', nullable: true })
    isCorrectRoom: boolean | null;

    @ApiProperty({ example: '2026-01-20T08:00:00.000Z', description: 'Timestamp' })
    timestamp: Date;

    @ApiProperty({ example: 'Success', description: 'Message optional', nullable: true })
    message: string | null;

    @ApiProperty({ example: 'device-uuid', description: 'Device ID', nullable: true })
    deviceId: string | null;

    @ApiProperty({ example: '2026-01-20T08:00:00.000Z', description: 'Created timestamp' })
    createdAt: Date;

    @ApiProperty({ example: '2026-01-20T08:00:00.000Z', description: 'Updated timestamp' })
    updatedAt: Date;
}

export class PaginatedAttendanceLogResponse {
    @ApiProperty({ type: [AttendanceLogResponse] })
    data: AttendanceLogResponse[];

    @ApiProperty({ example: 100, description: 'Total number of records' })
    total: number;

    @ApiProperty({ example: 1, description: 'Current page' })
    page: number;

    @ApiProperty({ example: 10, description: 'Records per page' })
    limit: number;

    @ApiProperty({ example: 10, description: 'Total pages' })
    totalPages: number;
}

export function toAttendanceLogResponse(log: AttendanceLog): AttendanceLogResponse {
    return {
        id: log.id,
        uid: log.uid,
        studentId: log.studentId,
        studentCode: log.studentCode,
        studentName: log.studentName,
        examSessionId: log.examSessionId,
        status: log.status,
        confidence: log.confidence,
        isCorrectRoom: log.isCorrectRoom,
        timestamp: log.timestamp,
        message: log.message,
        deviceId: log.deviceId,
        createdAt: log.createdAt,
        updatedAt: log.updatedAt,
    };
}
