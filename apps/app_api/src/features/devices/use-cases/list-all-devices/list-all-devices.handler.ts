import { Inject, Injectable } from '@nestjs/common';
import { IDeviceRepository, DEVICE_REPOSITORY } from '@app/devices';
import { PaginatedDeviceResponse, toDeviceResponse } from '../../shared';
import { ListAllDevicesDto } from './list-all-devices.dto';

@Injectable()
export class ListAllDevicesHandler {
    constructor(
        @Inject(DEVICE_REPOSITORY)
        private readonly repository: IDeviceRepository,
    ) { }

    async execute(dto: ListAllDevicesDto): Promise<PaginatedDeviceResponse> {
        const page = parseInt(String(dto.page || 1), 10);
        const limit = parseInt(String(dto.limit || 10), 10);
        const skip = (page - 1) * limit;

        const query: any = {
            skip,
            take: limit,
        };

        if (dto.ownerId) {
            query.ownerId = dto.ownerId;
        }

        if (dto.isActive !== undefined) {
            query.isActive = dto.isActive;
        }

        const [devices, total] = await Promise.all([
            this.repository.findMany(query),
            this.repository.count({
                ownerId: dto.ownerId,
                isActive: dto.isActive,
            }),
        ]);

        return {
            data: devices.map(toDeviceResponse),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
