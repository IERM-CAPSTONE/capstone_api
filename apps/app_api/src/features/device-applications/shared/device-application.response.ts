import { ApiProperty } from '@nestjs/swagger';
import { DeviceApplication } from '@app/devices-applications';

export class DeviceApplicationResponse {
    @ApiProperty({ example: 'uuid', description: 'Application ID' })
    id: string;

    @ApiProperty({ example: 'uuid', description: 'Device ID' })
    deviceId: string;

    @ApiProperty({ example: 'uuid', description: 'Registered by user ID' })
    registeredBy: string;

    @ApiProperty({ example: 'PENDING', enum: ['PENDING', 'APPROVED', 'REJECTED'], description: 'Application status' })
    status: string;

    @ApiProperty({ example: 'uuid', description: 'Approved by user ID', nullable: true })
    approvedBy: string | null;

    @ApiProperty({ example: '2026-01-20T08:00:00.000Z', description: 'Approved at', nullable: true })
    approvedAt: Date | null;

    @ApiProperty({ example: 'Reason', description: 'Rejected reason', nullable: true })
    rejectedReason: string | null;

    @ApiProperty({ example: '2026-01-20T08:00:00.000Z', description: 'Created timestamp' })
    createdAt: Date;

    @ApiProperty({ example: '2026-01-20T08:00:00.000Z', description: 'Updated timestamp' })
    updatedAt: Date;
}

export class PaginatedDeviceApplicationResponse {
    @ApiProperty({ type: [DeviceApplicationResponse] })
    data: DeviceApplicationResponse[];

    @ApiProperty({ example: 100, description: 'Total number of records' })
    total: number;

    @ApiProperty({ example: 1, description: 'Current page' })
    page: number;

    @ApiProperty({ example: 10, description: 'Records per page' })
    limit: number;

    @ApiProperty({ example: 10, description: 'Total pages' })
    totalPages: number;
}

export function toDeviceApplicationResponse(application: DeviceApplication): DeviceApplicationResponse {
    return {
        id: application.id,
        deviceId: application.deviceId,
        registeredBy: application.registeredBy,
        status: application.status,
        approvedBy: application.approvedBy,
        approvedAt: application.approvedAt,
        rejectedReason: application.rejectedReason,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
    };
}
