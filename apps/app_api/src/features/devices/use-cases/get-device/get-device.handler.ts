import { Inject, Injectable } from '@nestjs/common';
import { IDeviceRepository, DEVICE_REPOSITORY } from '@app/devices';
import { RoleType } from '@app/users';
import { DeviceResponse, toDeviceResponse } from '../../shared';

@Injectable()
export class GetDeviceHandler {
    constructor(
        @Inject(DEVICE_REPOSITORY)
        private readonly repository: IDeviceRepository,
    ) { }

    async execute(id: string, userId: string, role: string): Promise<DeviceResponse> {
        const device = await this.repository.findById(id);
        if (!device) {
            throw new Error('Device not found');
        }

        if (role === RoleType.PROCTOR && device.ownerId !== userId) {
            throw new Error('Device not found');
        }

        return toDeviceResponse(device);
    }
}
