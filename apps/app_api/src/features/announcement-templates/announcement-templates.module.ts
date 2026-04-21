import { Module } from '@nestjs/common';
import { AnnouncementTemplatesCoreModule } from '@app/announcement-templates';
import { NotificationGateway } from '../../common/gateways/notification.gateway';
import { FcmService } from '../../common/fcm/fcm.service';
import { ExamSessionsCoreModule } from '@app/exam-sessions';

import { AnnouncementTemplatesController } from './announcement-templates.controller';
import { CreateTemplateHandler } from './use-cases/create-template/create-template.handler';
import { ListTemplatesHandler } from './use-cases/list-templates/list-templates.handler';
import { UpdateTemplateHandler } from './use-cases/update-template/update-template.handler';
import { DeleteTemplateHandler } from './use-cases/delete-template/delete-template.handler';
import { BroadcastAnnouncementEndpoint } from './use-cases/broadcast-announcement/broadcast-announcement.endpoint';
import { BroadcastAnnouncementHandler } from './use-cases/broadcast-announcement/broadcast-announcement.handler';
import { ListBroadcastMessagesEndpoint, ListBroadcastMessagesHandler } from './use-cases/list-broadcast-messages';

@Module({
    imports: [AnnouncementTemplatesCoreModule, ExamSessionsCoreModule],
    controllers: [
        AnnouncementTemplatesController,
        BroadcastAnnouncementEndpoint,
        ListBroadcastMessagesEndpoint,
    ],
    providers: [
        CreateTemplateHandler,
        ListTemplatesHandler,
        UpdateTemplateHandler,
        DeleteTemplateHandler,
        BroadcastAnnouncementHandler,
        ListBroadcastMessagesHandler,
        NotificationGateway,
        FcmService,
    ],
})
export class AnnouncementTemplatesModule { }
