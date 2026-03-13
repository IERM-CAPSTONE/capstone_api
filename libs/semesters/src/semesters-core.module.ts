import { Module, Provider } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { SEMESTER_REPOSITORY } from './domain';
import { PrismaSemesterRepository } from './infrastructure/prisma-semester.repository';

const providers: Provider[] = [
    {
        provide: SEMESTER_REPOSITORY,
        useClass: PrismaSemesterRepository,
    },
];

@Module({
    imports: [PrismaModule],
    providers,
    exports: [SEMESTER_REPOSITORY],
})
export class SemestersCoreModule { }
