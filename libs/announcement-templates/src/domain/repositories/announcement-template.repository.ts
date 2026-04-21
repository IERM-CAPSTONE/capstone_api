import { AnnouncementTemplate } from '../entities/announcement-template.entity';

export const ANNOUNCEMENT_TEMPLATE_REPOSITORY = 'ANNOUNCEMENT_TEMPLATE_REPOSITORY';

export interface AnnouncementTemplateRepository {
    create(template: AnnouncementTemplate): Promise<void>;
    update(template: AnnouncementTemplate): Promise<void>;
    delete(id: string): Promise<void>;
    findById(id: string): Promise<AnnouncementTemplate | null>;
    findAll(params: {
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{ items: AnnouncementTemplate[]; total: number }>;
}
