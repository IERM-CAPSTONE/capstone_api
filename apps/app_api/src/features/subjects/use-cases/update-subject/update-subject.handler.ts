import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Subject, SubjectPart, ISubjectRepository, SUBJECT_REPOSITORY } from '@app/subjects';
import { CACHE_SERVICE, ICacheService } from '@app/cache';
import { SubjectResponse, toSubjectResponse } from '../../shared/subject.response';
import { UpdateSubjectDto } from './update-subject.dto';

@Injectable()
export class UpdateSubjectHandler {
    constructor(
        @Inject(SUBJECT_REPOSITORY)
        private readonly subjectRepository: ISubjectRepository,
        @Inject(CACHE_SERVICE)
        private readonly cacheService: ICacheService,
    ) { }

    async execute(id: string, dto: UpdateSubjectDto): Promise<SubjectResponse> {
        const subject = await this.subjectRepository.findById(id);
        if (!subject) {
            throw new NotFoundException(`Subject with ID '${id}' not found`);
        }

        const updated = subject.update({
            name: dto.name,
            semesterId: dto.semesterId,
            department: dto.department,
            isCoursera: dto.isCoursera,
            isMajor: dto.isMajor,
        });

        await this.subjectRepository.save(updated);

        // Update parts if provided (replace all)
        if (dto.parts !== undefined) {
            await this.subjectRepository.deleteAllPartsBySubjectId(id);
            for (const partDto of dto.parts) {
                const part = SubjectPart.create({
                    id: uuidv4(),
                    subjectId: id,
                    examPartId: partDto.examPartId,
                    duration: partDto.duration,
                });
                await this.subjectRepository.savePart(part);
            }
        }

        const fullyUpdated = await this.subjectRepository.findById(id);

        // Invalidate cache
        await this.cacheService.delByPrefix('subjects:list');

        return toSubjectResponse(fullyUpdated!);
    }
}
