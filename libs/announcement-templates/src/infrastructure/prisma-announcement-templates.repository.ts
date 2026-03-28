import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { AnnouncementTemplate } from '../domain/entities/announcement-template.entity';
import { AnnouncementTemplateRepository } from '../domain/repositories/announcement-template.repository';

@Injectable()
export class PrismaAnnouncementTemplateRepository implements AnnouncementTemplateRepository {
    constructor(private readonly prisma: PrismaService) { }

    async create(template: AnnouncementTemplate): Promise<any> {
        return await (this.prisma as any).announcementTemplate.create({
            data: {
                id: template.id,
                title: template.title,
                content: template.content,
                type: template.type,
                campus: template.campus,
                createdAt: template.createdAt,
                updatedAt: template.updatedAt,
            },
        });
    }

    async update(template: AnnouncementTemplate): Promise<void> {
        await (this.prisma as any).announcementTemplate.update({
            where: { id: template.id },
            data: {
                title: template.title,
                content: template.content,
                type: template.type,
                campus: template.campus,
                updatedAt: template.updatedAt,
            },
        });
    }

    async delete(id: string): Promise<void> {
        await (this.prisma as any).announcementTemplate.delete({
            where: { id },
        });
    }

    async findById(id: string): Promise<AnnouncementTemplate | null> {
        const found = await (this.prisma as any).announcementTemplate.findUnique({
            where: { id },
        });

        if (!found) return null;
        return AnnouncementTemplate.mapFromPrisma(found);
    }

    async findAll(params: {
        search?: string;
        campus?: string;
        page?: number;
        limit?: number;
    }): Promise<{ items: AnnouncementTemplate[]; total: number }> {
        const { search, campus } = params;
        const page = isNaN(Number(params.page)) ? 1 : Number(params.page);
        const limit = isNaN(Number(params.limit)) ? 10 : Number(params.limit);
        const skip = (page - 1) * limit;

        const where: any = {};
        
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' as any } },
                { content: { contains: search, mode: 'insensitive' as any } },
            ];
        }

        if (campus) {
            where.campus = campus;
        }

        let items: any[] = [];
        let total = 0;
        try {
            [items, total] = await Promise.all([
                (this.prisma as any).announcementTemplate.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                (this.prisma as any).announcementTemplate.count({ where }),
            ]);
        } catch (error: any) {
            // P2021: table does not exist. Return empty result so broadcast UI still works.
            if (error?.code === 'P2021') {
                console.warn('[WARN] AnnouncementTemplate table missing; returning empty template list.');
                return { items: [], total: 0 };
            }
            throw error;
        }

        console.log(`[DEBUG] Found ${items.length} templates out of ${total} total for campus: ${campus || 'ALL'}`);
        
        return {
            items: items.map(t => AnnouncementTemplate.mapFromPrisma(t)),
            total,
        };
    }
}
