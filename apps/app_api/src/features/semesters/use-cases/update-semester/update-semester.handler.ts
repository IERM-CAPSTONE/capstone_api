import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ISemesterRepository, SEMESTER_REPOSITORY } from '@app/semesters';
import { SemesterResponse, toSemesterResponse } from '../../shared/semester.response';
import { UpdateSemesterDto } from './update-semester.dto';

@Injectable()
export class UpdateSemesterHandler {
    constructor(
        @Inject(SEMESTER_REPOSITORY)
        private readonly semesterRepository: ISemesterRepository,
    ) { }

    async execute(id: string, dto: UpdateSemesterDto): Promise<SemesterResponse> {
        const semester = await this.semesterRepository.findById(id);
        if (!semester) {
            throw new NotFoundException(`Semester with ID ${id} not found`);
        }

        const updated = semester.update({
            name: dto.name,
            startDate: dto.startDate ? new Date(dto.startDate) : undefined,
            endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        });

        const saved = await this.semesterRepository.save(updated);
        return toSemesterResponse(saved);
    }
}
