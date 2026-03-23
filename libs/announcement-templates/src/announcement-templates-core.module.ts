import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { ANNOUNCEMENT_TEMPLATE_REPOSITORY } from './domain/repositories/announcement-template.repository';
import { PrismaAnnouncementTemplateRepository } from './infrastructure/prisma-announcement-templates.repository';

@Module({
    imports: [PrismaModule],
    providers: [
        {
            provide: ANNOUNCEMENT_TEMPLATE_REPOSITORY,
            useClass: PrismaAnnouncementTemplateRepository,
        },
    ],
    exports: [ANNOUNCEMENT_TEMPLATE_REPOSITORY],
})
export class AnnouncementTemplatesCoreModule { }
