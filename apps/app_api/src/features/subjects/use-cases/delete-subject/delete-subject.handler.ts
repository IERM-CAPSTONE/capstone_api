import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ISubjectRepository, SUBJECT_REPOSITORY } from '@app/subjects';
import { CACHE_SERVICE, ICacheService } from '@app/cache';

@Injectable()
export class DeleteSubjectHandler {
    constructor(
        @Inject(SUBJECT_REPOSITORY)
        private readonly subjectRepository: ISubjectRepository,
        @Inject(CACHE_SERVICE)
        private readonly cacheService: ICacheService,
    ) { }

    async execute(id: string): Promise<void> {
        const exists = await this.subjectRepository.exists({ id });
        if (!exists) {
            throw new NotFoundException(`Subject with ID '${id}' not found`);
        }

        await this.subjectRepository.delete(id);

        // Invalidate cache
        await this.cacheService.delByPrefix('subjects:list');
    }
}
