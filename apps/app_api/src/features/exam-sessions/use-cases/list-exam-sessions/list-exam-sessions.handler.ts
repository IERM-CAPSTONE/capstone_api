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

    async execute(dto: ListExamSessionsDto, user?: any): Promise<PaginatedExamSessionResponse> {
        const page = Number(dto.page) || 1;
        const limit = Number(dto.limit) || 10;
        const skip = (page - 1) * limit;
        const isStaff = user?.role === 'ADMIN' || user?.role === 'EXAM_OFFICER';
            // IMPORTANT: Only include actual filter fields, exclude pagination fields
            const finalQuery = {
                subjectCode: dto.subjectCode,
                examCode: dto.examCode,
                date: dto.date,
                time: dto.time,
                status: dto.status,
                fromDate: dto.fromDate,
                toDate: dto.toDate,
                startTime: dto.startTime,
                endTime: dto.endTime,
                examRoomId: dto.examRoomId,
                proctorId: dto.proctorId,
                hallInvigilatorId: dto.hallInvigilatorId,
                campus: dto.campus,
                examType: dto.examType,
                studentId: dto.studentId,
            };

        // If not staff, automatically filter out Draft sessions if no status is specified
        // or ensure they can't request Draft status explicitly
        if (!isStaff) {
            if (!dto.status) {
                (finalQuery as any).status = { not: 'Draft' };
            } else if (dto.status === 'Draft') {
                // Non-staff requesting Draft should get nothing or error
                // Here we force it to something that won't match Draft
                (finalQuery as any).status = { not: 'Draft' };
            }
        }

        const [items, total] = await Promise.all([
            this.repository.findMany({
                ...finalQuery,
                skip,
                take: limit,
            }),
            this.repository.count(finalQuery),
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
