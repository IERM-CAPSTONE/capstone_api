import { Inject, Injectable } from '@nestjs/common';
import { IDeviceRepository, DEVICE_REPOSITORY } from '@app/devices';
import { DeviceResponse, toDeviceResponse } from '../../shared';
import { UpdateDeviceStatusDto } from './update-device-status.dto';

@Injectable()
export class UpdateDeviceStatusHandler {
    constructor(
        @Inject(DEVICE_REPOSITORY)
        private readonly repository: IDeviceRepository,
    ) { }

    async execute(id: string, dto: UpdateDeviceStatusDto): Promise<DeviceResponse> {
        const device = await this.repository.findById(id);
        if (!device) {
            throw new Error('Device not found');
        }

        const updated = device.update({ isActive: dto.isActive });
        const saved = await this.repository.save(updated);
        return toDeviceResponse(saved);
    }
}
