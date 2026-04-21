/**
 * AnnouncementTemplate Aggregate Root
 */
import { AnnouncementType, Campus } from '@prisma/client';

export class AnnouncementTemplate {
    private constructor(
        public readonly id: string,
        public readonly title: string,
        public readonly content: string,
        public readonly type: AnnouncementType,
        public readonly campus: string | null,
        public readonly createdAt: Date,
        public readonly updatedAt: Date,
    ) { }

    static create(props: {
        id: string;
        title: string;
        content: string;
        type: AnnouncementType;
        campus?: string | null;
    }): AnnouncementTemplate {
        if (!props.title || props.title.trim() === '') {
            throw new Error('Template title must not be empty');
        }

        if (!props.content || props.content.trim() === '') {
            throw new Error('Template content must not be empty');
        }

        return new AnnouncementTemplate(
            props.id,
            props.title.trim(),
            props.content.trim(),
            props.type,
            props.campus ?? null,
            new Date(),
            new Date(),
        );
    }

    static reconstitute(props: {
        id: string;
        title: string;
        content: string;
        type: AnnouncementType;
        campus: string | null;
        createdAt: Date;
        updatedAt: Date;
    }): AnnouncementTemplate {
        return new AnnouncementTemplate(
            props.id,
            props.title,
            props.content,
            props.type,
            props.campus,
            props.createdAt,
            props.updatedAt,
        );
    }

    static mapFromPrisma(found: any): AnnouncementTemplate {
        return AnnouncementTemplate.reconstitute({
            id: found.id,
            title: found.title,
            content: found.content,
            type: found.type,
            campus: found.campus,
            createdAt: found.createdAt,
            updatedAt: found.updatedAt,
        });
    }

    update(props: {
        title?: string;
        content?: string;
        type?: AnnouncementType;
        campus?: string | null;
    }): AnnouncementTemplate {
        return new AnnouncementTemplate(
            this.id,
            props.title !== undefined ? props.title.trim() : this.title,
            props.content !== undefined ? props.content.trim() : this.content,
            props.type !== undefined ? props.type : this.type,
            props.campus !== undefined ? props.campus : this.campus,
            this.createdAt,
            new Date(),
        );
    }
}
