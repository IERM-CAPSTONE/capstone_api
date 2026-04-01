import { ApiProperty } from '@nestjs/swagger';
import { ProctorApplication } from '@app/proctor-applications';

export class ProctorApplicationResponse {
    @ApiProperty({ example: 'uuid', description: 'Application ID' })
    id: string;

    @ApiProperty({ example: 'uuid', description: 'Teacher ID' })
    teacherId: string;

    @ApiProperty({ example: 'John Doe', description: 'Teacher name', nullable: true })
    teacherName: string | null;

    @ApiProperty({ example: 'T001', description: 'Teacher code', nullable: true })
    teacherCode: string | null;

    @ApiProperty({ example: 'MORNING', enum: ['MORNING', 'AFTERNOON'], description: 'Preferred shift' })
    preferredShift: string;

    @ApiProperty({ example: 'ROOM', enum: ['ROOM', 'HALL'], description: 'Preferred type' })
    preferredType: string;

    @ApiProperty({
        example: ['2026-02-15T00:00:00.000Z', '2026-02-18T00:00:00.000Z'],
        description: 'One or many preferred dates',
        nullable: true,
        type: [String],
    })
    preferredDates: Date[];

    @ApiProperty({ example: 'Available on this date', description: 'Additional notes', nullable: true })
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
        teacherName: application.teacherName,
        teacherCode: application.teacherCode,
        preferredShift: application.preferredShift,
        preferredType: application.preferredType,
        preferredDates: application.preferredDates,
        notes: application.notes,
        status: application.status,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
    };
}
