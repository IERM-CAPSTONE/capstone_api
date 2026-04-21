import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Subject, SubjectPart, ISubjectRepository, SUBJECT_REPOSITORY } from '@app/subjects';
import { CACHE_SERVICE, ICacheService } from '@app/cache';
import { SubjectResponse, toSubjectResponse } from '../../shared/subject.response';
import { CreateSubjectDto } from './create-subject.dto';

@Injectable()
export class CreateSubjectHandler {
    constructor(
        @Inject(SUBJECT_REPOSITORY)
        private readonly subjectRepository: ISubjectRepository,
        @Inject(CACHE_SERVICE)
        private readonly cacheService: ICacheService,
    ) { }

    async execute(dto: CreateSubjectDto): Promise<SubjectResponse> {
        if (await this.subjectRepository.exists({ code: dto.code })) {
            throw new Error(`Subject with code '${dto.code}' already exists`);
        }

        const subjectId = uuidv4();

        // Create aggregate root
        const subject = Subject.create({
            id: subjectId,
            code: dto.code,
            name: dto.name,
            semesterId: dto.semesterId,
            department: dto.department,
            isCoursera: dto.isCoursera,
            isMajor: dto.isMajor,
        });

        // Persist subject first
        const savedSubject = await this.subjectRepository.save(subject);

        // Create parts if provided
        if (dto.parts && dto.parts.length > 0) {
            for (const partDto of dto.parts) {
                const part = SubjectPart.create({
                    id: uuidv4(),
                    subjectId: subjectId,
                    examPartId: partDto.examPartId,
                    duration: partDto.duration,
                });
                await this.subjectRepository.savePart(part);
            }
        }

        // Fetch back with parts
        const fullySavedSubject = await this.subjectRepository.findById(subjectId);

        // Invalidate cache
        await this.cacheService.delByPrefix('subjects:list');

        return toSubjectResponse(fullySavedSubject!);
    }
}
