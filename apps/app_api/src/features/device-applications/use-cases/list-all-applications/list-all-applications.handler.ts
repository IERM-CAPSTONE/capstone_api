import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { IDeviceApplicationRepository, DEVICE_APPLICATION_REPOSITORY } from '@app/devices-applications';
import { PaginatedDeviceApplicationResponse, toDeviceApplicationResponse } from '../../shared';
import { ListAllDeviceApplicationsDto } from './list-all-applications.dto';

@Injectable()
export class ListAllDeviceApplicationsHandler {
    constructor(
        @Inject(DEVICE_APPLICATION_REPOSITORY)
        private readonly repository: IDeviceApplicationRepository,
        private readonly prisma: PrismaService,
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

        const deviceIds = Array.from(new Set(applications.map((a) => a.deviceId)));
        const userIds = Array.from(
            new Set(
                applications.flatMap((a) => [a.registeredBy, a.approvedBy].filter(Boolean) as string[]),
            ),
        );

        const [devices, users] = await Promise.all([
            deviceIds.length > 0
                ? this.prisma.device.findMany({
                    where: { id: { in: deviceIds } },
                    select: { id: true, name: true, serial: true, metadata: true },
                })
                : Promise.resolve([]),
            userIds.length > 0
                ? this.prisma.user.findMany({
                    where: { id: { in: userIds } },
                    select: { id: true, fullName: true, username: true, email: true },
                })
                : Promise.resolve([]),
        ]);

        const deviceMap = new Map(devices.map((d) => [d.id, d]));
        const userMap = new Map(users.map((u) => [u.id, u]));

        return {
            data: applications.map((application) => {
                const dtoData = toDeviceApplicationResponse(application) as any;
                const device = deviceMap.get(application.deviceId);
                const registeredUser = userMap.get(application.registeredBy);
                const approvedUser = application.approvedBy ? userMap.get(application.approvedBy) : null;

                const metadata = (device?.metadata ?? {}) as Record<string, unknown>;

                return {
                    ...dtoData,
                    deviceName: device?.name ?? dtoData.deviceName ?? null,
                    deviceSerial: device?.serial ?? dtoData.deviceSerial ?? null,
                    manufacturer: (metadata.manufacturer as string) ?? null,
                    model: (metadata.model as string) ?? null,
                    os: (metadata.os as string) ?? null,
                    osVersion: (metadata.osVersion as string) ?? null,
                    appVersion: (metadata.appVersion as string) ?? null,
                    deviceMetadata: device?.metadata ?? null,
                    registeredByName:
                        registeredUser?.fullName ??
                        registeredUser?.username ??
                        registeredUser?.email ??
                        dtoData.registeredBy,
                    approvedByName:
                        approvedUser?.fullName ??
                        approvedUser?.username ??
                        approvedUser?.email ??
                        null,
                };
            }),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
