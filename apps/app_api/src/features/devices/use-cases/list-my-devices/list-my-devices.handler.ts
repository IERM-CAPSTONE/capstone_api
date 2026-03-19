import { Inject, Injectable } from '@nestjs/common';
import { IDeviceRepository, DEVICE_REPOSITORY } from '@app/devices';
import { DeviceResponse, toDeviceResponse } from '../../shared';

@Injectable()
export class ListMyDevicesHandler {
    constructor(
        @Inject(DEVICE_REPOSITORY)
        private readonly repository: IDeviceRepository,
    ) { }

    async execute(ownerId: string): Promise<DeviceResponse[]> {
        const devices = await this.repository.findMany({ ownerId });
        return devices.map(toDeviceResponse);
    }
}
