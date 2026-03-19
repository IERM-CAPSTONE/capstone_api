import { Inject, Injectable } from '@nestjs/common';
import { IDeviceApplicationRepository, DEVICE_APPLICATION_REPOSITORY } from '@app/devices-applications';

@Injectable()
export class DeleteDeviceApplicationHandler {
    constructor(
        @Inject(DEVICE_APPLICATION_REPOSITORY)
        private readonly repository: IDeviceApplicationRepository,
    ) { }

    async execute(id: string, userId: string): Promise<void> {
        const application = await this.repository.findById(id);
        if (!application || application.registeredBy !== userId) {
            throw new Error('Application not found');
        }

        if (application.status === 'APPROVED') {
            throw new Error('Application not found');
        }

        await this.repository.delete(id);
    }
}
