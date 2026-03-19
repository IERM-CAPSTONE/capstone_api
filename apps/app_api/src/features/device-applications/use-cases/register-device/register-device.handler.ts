import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Device, IDeviceRepository, DEVICE_REPOSITORY } from '@app/devices';
import { DeviceApplication, IDeviceApplicationRepository, DEVICE_APPLICATION_REPOSITORY } from '@app/devices-applications';
import { DeviceApplicationResponse, toDeviceApplicationResponse } from '../../shared';
import { RegisterDeviceApplicationDto } from './register-device.dto';

@Injectable()
export class RegisterDeviceApplicationHandler {
    constructor(
        @Inject(DEVICE_REPOSITORY)
        private readonly deviceRepository: IDeviceRepository,
        @Inject(DEVICE_APPLICATION_REPOSITORY)
        private readonly applicationRepository: IDeviceApplicationRepository,
    ) { }

    async execute(dto: RegisterDeviceApplicationDto, userId: string): Promise<DeviceApplicationResponse> {
        const existingDevice = await this.deviceRepository.findOne({ serial: dto.serial });
        const device = existingDevice ?? Device.create({
            id: uuidv4(),
            name: dto.name,
            serial: dto.serial,
            ownerId: userId,
            metadata: dto.metadata ?? null,
            isActive: false,
        });

        const savedDevice = existingDevice ? device : await this.deviceRepository.save(device);

        if (savedDevice.isActive) {
            throw new Error('Thiết bị đã được đăng ký');
        }

        const applications = await this.applicationRepository.findMany({
            deviceId: savedDevice.id,
            registeredBy: userId,
            take: 1,
        });
        const latestApplication = applications[0];

        if (latestApplication?.status === 'PENDING') {
            throw new Error('Thiết bị đã được đăng ký và đang được chờ duyệt');
        }

        const newApplication = DeviceApplication.create({
            id: uuidv4(),
            deviceId: savedDevice.id,
            registeredBy: userId,
        });

        const savedApplication = await this.applicationRepository.save(newApplication);

        return toDeviceApplicationResponse(savedApplication);
    }
}
