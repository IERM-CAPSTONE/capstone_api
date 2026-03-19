import { Inject, Injectable } from '@nestjs/common';
import { IDeviceApplicationRepository, DEVICE_APPLICATION_REPOSITORY } from '@app/devices-applications';
import { PaginatedDeviceApplicationResponse, toDeviceApplicationResponse } from '../../shared';
import { ListAllDeviceApplicationsDto } from './list-all-applications.dto';

@Injectable()
export class ListAllDeviceApplicationsHandler {
    constructor(
        @Inject(DEVICE_APPLICATION_REPOSITORY)
        private readonly repository: IDeviceApplicationRepository,
    ) { }

    async execute(dto: ListAllDeviceApplicationsDto): Promise<PaginatedDeviceApplicationResponse> {
        const page = parseInt(String(dto.page || 1), 10);
        const limit = parseInt(String(dto.limit || 10), 10);
        const skip = (page - 1) * limit;

        const query: any = {
            skip,
            take: limit,
        };

        if (dto.deviceId) {
            query.deviceId = dto.deviceId;
        }

        if (dto.registeredBy) {
            query.registeredBy = dto.registeredBy;
        }

        if (dto.status) {
            query.status = dto.status;
        }

        const [applications, total] = await Promise.all([
            this.repository.findMany(query),
            this.repository.count({
                deviceId: dto.deviceId,
                registeredBy: dto.registeredBy,
                status: dto.status,
            }),
        ]);

        return {
            data: applications.map(toDeviceApplicationResponse),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
