import { Inject, Injectable } from '@nestjs/common';
import { ISemesterRepository, SEMESTER_REPOSITORY } from '@app/semesters';
import {
    SemesterPaginationResponse,
    toSemesterResponse
} from '../../shared/semester.response';

@Injectable()
export class ListSemestersHandler {
    constructor(
        @Inject(SEMESTER_REPOSITORY)
        private readonly semesterRepository: ISemesterRepository,
    ) { }

    async execute(query: {
        page: number;
        limit: number;
        search?: string;
        fromDate?: string;
        toDate?: string;
    }): Promise<SemesterPaginationResponse> {
        const { items, total } = await this.semesterRepository.findAllWithPagination({
            page: Number(query.page),
            limit: Number(query.limit),
            search: query.search,
            fromDate: query.fromDate ? new Date(query.fromDate) : undefined,
            toDate: query.toDate ? new Date(query.toDate) : undefined,
        });

        return {
            data: items.map(toSemesterResponse),
            total,
            page: Number(query.page),
            limit: Number(query.limit),
            totalPages: Math.ceil(total / Number(query.limit)),
        };
    }
}
