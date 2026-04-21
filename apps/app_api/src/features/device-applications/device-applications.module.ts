import { Module } from '@nestjs/common';
import { DevicesCoreModule } from '@app/devices';
import { DevicesApplicationsCoreModule } from '@app/devices-applications';

import { RegisterDeviceApplicationHandler, RegisterDeviceApplicationEndpoint } from './use-cases/register-device';
import { ListMyDeviceApplicationsHandler, ListMyDeviceApplicationsEndpoint } from './use-cases/list-my-applications';
import { ListAllDeviceApplicationsHandler, ListAllDeviceApplicationsEndpoint } from './use-cases/list-all-applications';
import { GetDeviceApplicationHandler, GetDeviceApplicationEndpoint } from './use-cases/get-application';
import { DeleteDeviceApplicationHandler, DeleteDeviceApplicationEndpoint } from './use-cases/delete-application';
import { UpdateDeviceApplicationStatusHandler, UpdateDeviceApplicationStatusEndpoint } from './use-cases/update-status';

@Module({
    imports: [DevicesApplicationsCoreModule, DevicesCoreModule],
    controllers: [
        RegisterDeviceApplicationEndpoint,
        ListMyDeviceApplicationsEndpoint,
        ListAllDeviceApplicationsEndpoint,
        GetDeviceApplicationEndpoint,
        DeleteDeviceApplicationEndpoint,
        UpdateDeviceApplicationStatusEndpoint,
    ],
    providers: [
        RegisterDeviceApplicationHandler,
        ListMyDeviceApplicationsHandler,
        ListAllDeviceApplicationsHandler,
        GetDeviceApplicationHandler,
        DeleteDeviceApplicationHandler,
        UpdateDeviceApplicationStatusHandler,
    ],
})
export class DeviceApplicationsModule { }
