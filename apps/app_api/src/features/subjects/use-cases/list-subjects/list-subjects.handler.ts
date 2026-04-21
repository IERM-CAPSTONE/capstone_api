import { Inject, Injectable } from '@nestjs/common';
import { ISubjectRepository, SUBJECT_REPOSITORY } from '@app/subjects';
import { SubjectPaginationResponse, SubjectResponse, toSubjectResponse } from '../../shared/subject.response';

@Injectable()
export class ListSubjectsHandler {
    constructor(
        @Inject(SUBJECT_REPOSITORY)
        private readonly subjectRepository: ISubjectRepository,
    ) { }

    async execute(query: {
        semesterId?: string;
        department?: string;
        page: number;
        limit: number;
        search?: string;
    }): Promise<SubjectPaginationResponse> {
        const { items, total } = await this.subjectRepository.findAllWithPagination({
            semesterId: query.semesterId,
            department: query.department,
            page: Number(query.page),
            limit: Number(query.limit),
            search: query.search,
        });

        return {
            data: items.map(toSubjectResponse),
            total,
            page: Number(query.page),
            limit: Number(query.limit),
            totalPages: Math.ceil(total / Number(query.limit)),
        };
    }
}
