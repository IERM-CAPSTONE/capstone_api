import { Inject, Injectable } from '@nestjs/common';
import { IDeviceApplicationRepository, DEVICE_APPLICATION_REPOSITORY } from '@app/devices-applications';
import { IDeviceRepository, DEVICE_REPOSITORY } from '@app/devices';
import { DeviceApplicationResponse, toDeviceApplicationResponse } from '../../shared';
import { UpdateDeviceApplicationStatusDto } from './update-status.dto';

@Injectable()
export class UpdateDeviceApplicationStatusHandler {
    constructor(
        @Inject(DEVICE_APPLICATION_REPOSITORY)
        private readonly repository: IDeviceApplicationRepository,
        @Inject(DEVICE_REPOSITORY)
        private readonly deviceRepository: IDeviceRepository,
    ) { }

    async execute(id: string, dto: UpdateDeviceApplicationStatusDto, approverId: string): Promise<DeviceApplicationResponse> {
        const application = await this.repository.findById(id);
        if (!application) {
            throw new Error('Application not found');
        }

        if (dto.status === 'REJECTED' && !dto.rejectedReason) {
            throw new Error('Rejected reason is required');
        }

        const processedAt = new Date();

        const updated = application.update({
            status: dto.status as any,
            approvedBy: approverId,
            approvedAt: processedAt,
            rejectedReason: dto.status === 'REJECTED' ? dto.rejectedReason ?? null : null,
        });

        const saved = await this.repository.save(updated);

        if (dto.status === 'APPROVED') {
            const device = await this.deviceRepository.findById(application.deviceId);
            if (device) {
                await this.deviceRepository.save(device.update({ isActive: true }));
            }
        }

        return toDeviceApplicationResponse(saved);
    }
}
