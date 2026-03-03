import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { SUBJECT_REPOSITORY } from './domain';
import { PrismaSubjectRepository } from './infrastructure';

@Module({
    imports: [PrismaModule],
    providers: [
        {
            provide: SUBJECT_REPOSITORY,
            useClass: PrismaSubjectRepository,
        },
    ],
    exports: [SUBJECT_REPOSITORY],
})
export class SubjectsCoreModule { }
