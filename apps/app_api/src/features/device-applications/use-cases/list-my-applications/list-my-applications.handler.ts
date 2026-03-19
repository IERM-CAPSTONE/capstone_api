import { Inject, Injectable } from '@nestjs/common';
import { IDeviceApplicationRepository, DEVICE_APPLICATION_REPOSITORY } from '@app/devices-applications';
import { PrismaService } from '@app/prisma';
import { DeviceApplicationResponse, toDeviceApplicationResponse } from '../../shared';

@Injectable()
export class ListMyDeviceApplicationsHandler {
    constructor(
        @Inject(DEVICE_APPLICATION_REPOSITORY)
        private readonly repository: IDeviceApplicationRepository,
        private readonly prisma: PrismaService,
    ) { }

    async execute(userId: string): Promise<DeviceApplicationResponse[]> {
        const applications = await this.prisma.deviceApplication.findMany({
            where: { registeredBy: userId },
            include: { device: { select: { name: true, serial: true } } },
            orderBy: { createdAt: 'desc' },
        });

        return applications.map(app => {
            const base = toDeviceApplicationResponse(app as any);
            base.deviceName = (app as any).device?.name ?? null;
            base.deviceSerial = (app as any).device?.serial ?? null;
            return base;
        });
    }
}
