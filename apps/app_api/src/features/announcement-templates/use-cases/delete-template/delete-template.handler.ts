import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { 
    AnnouncementTemplateRepository, 
    ANNOUNCEMENT_TEMPLATE_REPOSITORY 
} from '@app/announcement-templates';

export interface DeleteTemplateCommand {
    id: string;
}

@Injectable()
export class DeleteTemplateHandler {
    private readonly logger = new Logger(DeleteTemplateHandler.name);

    constructor(
        @Inject(ANNOUNCEMENT_TEMPLATE_REPOSITORY)
        private readonly repository: AnnouncementTemplateRepository,
    ) { }

    async execute(command: DeleteTemplateCommand) {
        this.logger.log(`Deleting announcement template: ${command.id}`);

        const template = await this.repository.findById(command.id);
        if (!template) {
            throw new NotFoundException(`Template with ID ${command.id} not found`);
        }

        await this.repository.delete(command.id);
        
        return { success: true };
    }
}
