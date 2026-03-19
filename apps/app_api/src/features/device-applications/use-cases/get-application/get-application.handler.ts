import { Inject, Injectable } from '@nestjs/common';
import { IDeviceApplicationRepository, DEVICE_APPLICATION_REPOSITORY } from '@app/devices-applications';
import { RoleType } from '@app/users';
import { DeviceApplicationResponse, toDeviceApplicationResponse } from '../../shared';

@Injectable()
export class GetDeviceApplicationHandler {
    constructor(
        @Inject(DEVICE_APPLICATION_REPOSITORY)
        private readonly repository: IDeviceApplicationRepository,
    ) { }

    async execute(id: string, userId: string, role: string): Promise<DeviceApplicationResponse> {
        const application = await this.repository.findById(id);
        if (!application) {
            throw new Error('Application not found');
        }

        if (role === RoleType.PROCTOR && application.registeredBy !== userId) {
            throw new Error('Application not found');
        }

        return toDeviceApplicationResponse(application);
    }
}
