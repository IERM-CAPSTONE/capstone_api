import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { IDeviceRepository, DEVICE_REPOSITORY } from '@app/devices';
import { PaginatedDeviceResponse, toDeviceResponse } from '../../shared';
import { ListAllDevicesDto } from './list-all-devices.dto';

@Injectable()
export class ListAllDevicesHandler {
    constructor(
        @Inject(DEVICE_REPOSITORY)
        private readonly repository: IDeviceRepository,
        private readonly prisma: PrismaService,
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

        const ownerIds = Array.from(new Set(devices.map((d) => d.ownerId).filter(Boolean)));
        const owners = ownerIds.length > 0
            ? await this.prisma.user.findMany({
                where: { id: { in: ownerIds } },
                select: { id: true, fullName: true, username: true, email: true },
            })
            : [];

        const ownerMap = new Map(owners.map((u) => [u.id, u]));

        return {
            data: devices.map((device) => {
                const dtoData = toDeviceResponse(device) as any;
                const owner = ownerMap.get(device.ownerId);

                return {
                    ...dtoData,
                    ownerName: owner?.fullName ?? owner?.username ?? owner?.email ?? null,
                };
            }),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
