import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ISemesterRepository, SEMESTER_REPOSITORY } from '@app/semesters';

@Injectable()
export class DeleteSemesterHandler {
    constructor(
        @Inject(SEMESTER_REPOSITORY)
        private readonly semesterRepository: ISemesterRepository,
    ) { }

    async execute(id: string): Promise<void> {
        const exists = await this.semesterRepository.exists({ id });
        if (!exists) {
            throw new NotFoundException(`Semester with ID ${id} not found`);
        }

        await this.semesterRepository.delete(id);
    }
}
