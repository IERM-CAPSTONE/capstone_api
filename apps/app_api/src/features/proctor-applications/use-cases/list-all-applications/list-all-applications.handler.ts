import { Inject, Injectable } from '@nestjs/common';
import { IProctorApplicationRepository, PROCTOR_APPLICATION_REPOSITORY } from '@app/proctor-applications';
import { PaginatedProctorApplicationResponse, toProctorApplicationResponse } from '../../shared/proctor-application.response';
import { ListAllProctorApplicationsDto } from './list-all-applications.dto';

@Injectable()
export class ListAllProctorApplicationsHandler {
    constructor(
        @Inject(PROCTOR_APPLICATION_REPOSITORY)
        private readonly repository: IProctorApplicationRepository,
    ) { }

    async execute(dto: ListAllProctorApplicationsDto): Promise<PaginatedProctorApplicationResponse> {
        const page = dto.page ?? 1;
        const limit = dto.limit ?? 10;

        const { data, total } = await this.repository.findMany({
            teacherId: dto.teacherId,
            status: dto.status,
            preferredDateStart: dto.preferredDateStart ? this.toStartOfDay(dto.preferredDateStart) : undefined,
            preferredDateEnd: dto.preferredDateEnd ? this.toStartOfDay(dto.preferredDateEnd) : undefined,
            page,
            limit,
        });

        return {
            data: data.map(toProctorApplicationResponse),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    private toStartOfDay(value: Date | string): Date {
        if (value instanceof Date) {
            const normalized = new Date(value);
            normalized.setHours(0, 0, 0, 0);
            return normalized;
        }

        const [year, month, day] = value.split('T')[0].split('-').map(Number);
        return new Date(year, month - 1, day, 0, 0, 0, 0);
    }
}
