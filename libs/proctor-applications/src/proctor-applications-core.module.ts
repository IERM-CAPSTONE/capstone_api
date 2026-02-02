import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { PROCTOR_APPLICATION_REPOSITORY } from './domain/repositories';
import { PrismaProctorApplicationRepository } from './infrastructure';

@Global()
@Module({
    imports: [PrismaModule],
    providers: [
        {
            provide: PROCTOR_APPLICATION_REPOSITORY,
            useClass: PrismaProctorApplicationRepository,
        },
    ],
    exports: [PROCTOR_APPLICATION_REPOSITORY],
})
export class ProctorApplicationsCoreModule { }
