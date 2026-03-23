import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { AnnouncementType } from '@prisma/client';
import { 
    AnnouncementTemplateRepository, 
    ANNOUNCEMENT_TEMPLATE_REPOSITORY 
} from '@app/announcement-templates';

export interface UpdateTemplateCommand {
    id: string;
    title?: string;
    content?: string;
    type?: AnnouncementType;
    campus?: string;
}

@Injectable()
export class UpdateTemplateHandler {
    private readonly logger = new Logger(UpdateTemplateHandler.name);

    constructor(
        @Inject(ANNOUNCEMENT_TEMPLATE_REPOSITORY)
        private readonly repository: AnnouncementTemplateRepository,
    ) { }

    async execute(command: UpdateTemplateCommand) {
        this.logger.log(`Updating announcement template: ${command.id}`);

        const template = await this.repository.findById(command.id);
        if (!template) {
            throw new NotFoundException(`Template with ID ${command.id} not found`);
        }

        const updatedTemplate = template.update({
            title: command.title,
            content: command.content,
            type: command.type,
            campus: command.campus,
        });

        await this.repository.update(updatedTemplate);
        
        return updatedTemplate;
    }
}
