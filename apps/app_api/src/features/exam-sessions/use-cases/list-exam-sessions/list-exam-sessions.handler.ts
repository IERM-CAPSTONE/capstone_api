import { Inject, Injectable } from '@nestjs/common';
import { IExamSessionRepository, EXAM_SESSION_REPOSITORY } from '@app/exam-sessions';
import { PaginatedExamSessionResponse, toExamSessionResponse } from '../../shared/exam-session.response';
import { ListExamSessionsDto } from './list-exam-sessions.dto';

@Injectable()
export class ListExamSessionsHandler {
    constructor(
        @Inject(EXAM_SESSION_REPOSITORY)
        private readonly repository: IExamSessionRepository,
    ) { }

    async execute(dto: ListExamSessionsDto): Promise<PaginatedExamSessionResponse> {
        const page = Number(dto.page) || 1;
        const limit = Number(dto.limit) || 10;
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
            this.repository.findMany({
                ...dto,
                skip,
                take: limit,
            }),
            this.repository.count(dto),
        ]);

        return {
            data: items.map(toExamSessionResponse),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
}
