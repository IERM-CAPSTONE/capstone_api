import { Injectable, Inject, Logger } from '@nestjs/common';
import { 
    AnnouncementTemplateRepository, 
    ANNOUNCEMENT_TEMPLATE_REPOSITORY 
} from '@app/announcement-templates';

export interface ListTemplatesQuery {
    page?: number;
    limit?: number;
    search?: string;
    campus?: string;
}

@Injectable()
export class ListTemplatesHandler {
    private readonly logger = new Logger(ListTemplatesHandler.name);

    constructor(
        @Inject(ANNOUNCEMENT_TEMPLATE_REPOSITORY)
        private readonly repository: AnnouncementTemplateRepository,
    ) { }

    async execute(query: ListTemplatesQuery) {
        this.logger.log(`Listing announcement templates (page: ${query.page}, limit: ${query.limit}, search: ${query.search}, campus: ${query.campus})`);
        return await this.repository.findAll(query);
    }
}
