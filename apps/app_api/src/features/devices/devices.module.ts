import { Module } from '@nestjs/common';
import { DevicesCoreModule } from '@app/devices';

import { ListMyDevicesHandler, ListMyDevicesEndpoint } from './use-cases/list-my-devices';
import { ListAllDevicesHandler, ListAllDevicesEndpoint } from './use-cases/list-all-devices';
import { GetDeviceHandler, GetDeviceEndpoint } from './use-cases/get-device';
import { DeleteDeviceHandler, DeleteDeviceEndpoint } from './use-cases/delete-device';
import { UpdateDeviceStatusHandler, UpdateDeviceStatusEndpoint } from './use-cases/update-device-status';

@Module({
    imports: [DevicesCoreModule],
    controllers: [
        ListMyDevicesEndpoint,
        ListAllDevicesEndpoint,
        GetDeviceEndpoint,
        DeleteDeviceEndpoint,
        UpdateDeviceStatusEndpoint,
    ],
    providers: [
        ListMyDevicesHandler,
        ListAllDevicesHandler,
        GetDeviceHandler,
        DeleteDeviceHandler,
        UpdateDeviceStatusHandler,
    ],
})
export class DevicesModule { }
