import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { DEVICE_APPLICATION_REPOSITORY } from './domain/repositories';
import { PrismaDeviceApplicationRepository } from './infrastructure';

@Global()
@Module({
    imports: [PrismaModule],
    providers: [
        {
            provide: DEVICE_APPLICATION_REPOSITORY,
            useClass: PrismaDeviceApplicationRepository,
        },
    ],
    exports: [DEVICE_APPLICATION_REPOSITORY],
})
export class DevicesApplicationsCoreModule { }
