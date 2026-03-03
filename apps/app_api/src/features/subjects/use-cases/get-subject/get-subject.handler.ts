import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ISubjectRepository, SUBJECT_REPOSITORY } from '@app/subjects';
import { SubjectResponse, toSubjectResponse } from '../../shared/subject.response';

@Injectable()
export class GetSubjectHandler {
    constructor(
        @Inject(SUBJECT_REPOSITORY)
        private readonly subjectRepository: ISubjectRepository,
    ) { }

    async execute(id: string): Promise<SubjectResponse> {
        const subject = await this.subjectRepository.findById(id);
        if (!subject) {
            throw new NotFoundException(`Subject with ID '${id}' not found`);
        }
        return toSubjectResponse(subject);
    }
}
