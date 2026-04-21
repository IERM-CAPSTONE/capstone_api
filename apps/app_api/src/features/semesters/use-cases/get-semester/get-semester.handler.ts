import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ISemesterRepository, SEMESTER_REPOSITORY } from '@app/semesters';
import { SemesterResponse, toSemesterResponse } from '../../shared/semester.response';

@Injectable()
export class GetSemesterHandler {
    constructor(
        @Inject(SEMESTER_REPOSITORY)
        private readonly semesterRepository: ISemesterRepository,
    ) { }

    async execute(id: string): Promise<SemesterResponse> {
        const semester = await this.semesterRepository.findById(id);
        if (!semester) {
            throw new NotFoundException(`Semester with ID ${id} not found`);
        }
        return toSemesterResponse(semester);
    }
}
