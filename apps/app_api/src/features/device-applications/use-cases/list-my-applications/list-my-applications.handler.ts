import { Inject, Injectable } from '@nestjs/common';
import { IDeviceApplicationRepository, DEVICE_APPLICATION_REPOSITORY } from '@app/devices-applications';
import { DeviceApplicationResponse, toDeviceApplicationResponse } from '../../shared';

@Injectable()
export class ListMyDeviceApplicationsHandler {
    constructor(
        @Inject(DEVICE_APPLICATION_REPOSITORY)
        private readonly repository: IDeviceApplicationRepository,
    ) { }

    async execute(userId: string): Promise<DeviceApplicationResponse[]> {
        const applications = await this.repository.findMany({ registeredBy: userId });
        return applications.map(toDeviceApplicationResponse);
    }
}
