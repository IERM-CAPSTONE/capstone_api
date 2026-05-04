import { ApiProperty } from '@nestjs/swagger';
import { ProctorApplication } from '@app/proctor-applications';

export class ProctorApplicationResponse {
    @ApiProperty({ example: 'uuid', description: 'Application ID' })
    id: string;

    @ApiProperty({ example: 'uuid', description: 'Requester teacher ID' })
    teacherId: string;

    @ApiProperty({ example: 'uuid', description: 'Target teacher ID', nullable: true })
    targetTeacherId: string | null;

    @ApiProperty({ example: 'uuid', description: 'Source exam session ID', nullable: true })
    examSessionId: string | null;

    @ApiProperty({ example: 'uuid', description: 'Target exam session ID', nullable: true })
    targetExamSessionId: string | null;

    @ApiProperty({ example: 'John Doe', description: 'Requester teacher name', nullable: true })
    teacherName: string | null;

    @ApiProperty({ example: 'T001', description: 'Requester teacher code', nullable: true })
    teacherCode: string | null;

    @ApiProperty({ example: 'Jane Smith', description: 'Target teacher name', nullable: true })
    targetTeacherName: string | null;

    @ApiProperty({ example: 'T002', description: 'Target teacher code', nullable: true })
    targetTeacherCode: string | null;

    @ApiProperty({ example: 'MORNING', enum: ['MORNING', 'AFTERNOON'], description: 'Preferred shift' })
    preferredShift: string;

    @ApiProperty({ example: 'ROOM', enum: ['ROOM', 'HALL'], description: 'Preferred type' })
    preferredType: string;

    @ApiProperty({ example: '2026-02-15T00:00:00.000Z', description: 'Preferred date', nullable: true })
    preferredDate: Date | null;

    @ApiProperty({ example: 'A101', description: 'Source room number', nullable: true })
    roomNumber: string | null;

    @ApiProperty({ example: '2026-02-15T07:00:00.000Z', description: 'Source exam open time', nullable: true })
    examOpenTime: Date | null;

    @ApiProperty({ example: '2026-02-15T09:00:00.000Z', description: 'Source exam close time', nullable: true })
    examCloseTime: Date | null;

    @ApiProperty({ example: 'A102', description: 'Target room number', nullable: true })
    targetRoomNumber: string | null;

    @ApiProperty({ example: '2026-02-15T07:00:00.000Z', description: 'Target exam open time', nullable: true })
    targetExamOpenTime: Date | null;

    @ApiProperty({ example: '2026-02-15T09:00:00.000Z', description: 'Target exam close time', nullable: true })
    targetExamCloseTime: Date | null;

    @ApiProperty({ example: 'Please swap with me', description: 'Additional notes', nullable: true })
    notes: string | null;

    @ApiProperty({ example: 'PENDING', enum: ['PENDING', 'APPROVED', 'REJECTED', 'CANCELED'], description: 'Application status' })
    status: string;

    @ApiProperty({ example: '2026-01-20T08:00:00.000Z', description: 'Created timestamp' })
    createdAt: Date;

    @ApiProperty({ example: '2026-01-20T08:00:00.000Z', description: 'Updated timestamp' })
    updatedAt: Date;
}

export class PaginatedProctorApplicationResponse {
    @ApiProperty({ type: [ProctorApplicationResponse] })
    data: ProctorApplicationResponse[];

    @ApiProperty({ example: 100, description: 'Total number of records' })
    total: number;

    @ApiProperty({ example: 1, description: 'Current page' })
    page: number;

    @ApiProperty({ example: 10, description: 'Records per page' })
    limit: number;

    @ApiProperty({ example: 10, description: 'Total pages' })
    totalPages: number;
}

export function toProctorApplicationResponse(application: ProctorApplication): ProctorApplicationResponse {
    return {
        id: application.id,
        teacherId: application.teacherId,
        targetTeacherId: application.targetTeacherId,
        examSessionId: application.examSessionId,
        targetExamSessionId: application.targetExamSessionId,
        teacherName: application.teacherName,
        teacherCode: application.teacherCode,
        targetTeacherName: application.targetTeacherName,
        targetTeacherCode: application.targetTeacherCode,
        preferredShift: application.preferredShift,
        preferredType: application.preferredType,
        preferredDate: application.preferredDate,
        roomNumber: application.roomNumber,
        examOpenTime: application.examOpenTime,
        examCloseTime: application.examCloseTime,
        targetRoomNumber: application.targetRoomNumber,
        targetExamOpenTime: application.targetExamOpenTime,
        targetExamCloseTime: application.targetExamCloseTime,
        notes: application.notes,
        status: application.status,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
    };
}
