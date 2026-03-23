import { Injectable, Inject, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { AnnouncementType } from '@prisma/client';
import { 
    AnnouncementTemplate, 
    AnnouncementTemplateRepository, 
    ANNOUNCEMENT_TEMPLATE_REPOSITORY 
} from '@app/announcement-templates';

export interface CreateTemplateCommand {
    title: string;
    content: string;
    type: AnnouncementType;
    campus?: string;
}

@Injectable()
export class CreateTemplateHandler {
    private readonly logger = new Logger(CreateTemplateHandler.name);

    constructor(
        @Inject(ANNOUNCEMENT_TEMPLATE_REPOSITORY)
        private readonly repository: AnnouncementTemplateRepository,
    ) { }

    async execute(command: CreateTemplateCommand): Promise<AnnouncementTemplate> {
        this.logger.log(`Creating announcement template: ${command.title}`);

        const template = AnnouncementTemplate.create({
            id: uuidv4(),
            title: command.title,
            content: command.content,
            type: command.type,
            campus: command.campus,
        });

        await this.repository.create(template);
        
        return template;
    }
}
