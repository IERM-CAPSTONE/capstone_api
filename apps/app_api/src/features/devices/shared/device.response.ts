import { ApiProperty } from '@nestjs/swagger';
import { Device, DeviceMetadata } from '@app/devices';

export class DeviceResponse {
    @ApiProperty({ example: 'uuid', description: 'Device ID' })
    id: string;

    @ApiProperty({ example: 'Samsung A54', description: 'Device name' })
    name: string;

    @ApiProperty({ example: 'device-serial', description: 'Device serial (unique)' })
    serial: string;

    @ApiProperty({ example: 'uuid', description: 'Owner user ID' })
    ownerId: string;

    @ApiProperty({ description: 'Device metadata', nullable: true })
    metadata: DeviceMetadata | null;

    @ApiProperty({ example: false, description: 'Active status' })
    isActive: boolean;

    @ApiProperty({ example: '2026-01-20T08:00:00.000Z', description: 'Created timestamp' })
    createdAt: Date;

    @ApiProperty({ example: '2026-01-20T08:00:00.000Z', description: 'Updated timestamp' })
    updatedAt: Date;
}

export class PaginatedDeviceResponse {
    @ApiProperty({ type: [DeviceResponse] })
    data: DeviceResponse[];

    @ApiProperty({ example: 100, description: 'Total number of records' })
    total: number;

    @ApiProperty({ example: 1, description: 'Current page' })
    page: number;

    @ApiProperty({ example: 10, description: 'Records per page' })
    limit: number;

    @ApiProperty({ example: 10, description: 'Total pages' })
    totalPages: number;
}

export function toDeviceResponse(device: Device): DeviceResponse {
    return {
        id: device.id,
        name: device.name,
        serial: device.serial,
        ownerId: device.ownerId,
        metadata: device.metadata ?? null,
        isActive: device.isActive,
        createdAt: device.createdAt,
        updatedAt: device.updatedAt,
    };
}
