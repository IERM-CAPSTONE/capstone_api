import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { DEVICE_REPOSITORY } from './domain/repositories';
import { PrismaDeviceRepository } from './infrastructure';

@Global()
@Module({
    imports: [PrismaModule],
    providers: [
        {
            provide: DEVICE_REPOSITORY,
            useClass: PrismaDeviceRepository,
        },
    ],
    exports: [DEVICE_REPOSITORY],
})
export class DevicesCoreModule { }
