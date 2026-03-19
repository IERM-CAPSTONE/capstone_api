import { Inject, Injectable } from '@nestjs/common';
import { IDeviceRepository, DEVICE_REPOSITORY } from '@app/devices';

@Injectable()
export class DeleteDeviceHandler {
    constructor(
        @Inject(DEVICE_REPOSITORY)
        private readonly repository: IDeviceRepository,
    ) { }

    async execute(id: string, ownerId: string): Promise<void> {
        const device = await this.repository.findById(id);
        if (!device || device.ownerId !== ownerId) {
            throw new Error('Device not found');
        }

        await this.repository.delete(id);
    }
}
