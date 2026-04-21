import { Inject, Injectable, ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ISemesterRepository, SEMESTER_REPOSITORY, Semester } from '@app/semesters';
import { SemesterResponse, toSemesterResponse } from '../../shared/semester.response';
import { CreateSemesterDto } from './create-semester.dto';

@Injectable()
export class CreateSemesterHandler {
    constructor(
        @Inject(SEMESTER_REPOSITORY)
        private readonly semesterRepository: ISemesterRepository,
    ) { }

    async execute(dto: CreateSemesterDto): Promise<SemesterResponse> {
        const exists = await this.semesterRepository.exists({ code: dto.code.trim().toUpperCase() });
        if (exists) {
            throw new ConflictException(`Semester with code ${dto.code} already exists`);
        }

        const semester = Semester.create({
            id: uuidv4(),
            code: dto.code,
            name: dto.name,
            startDate: new Date(dto.startDate),
            endDate: new Date(dto.endDate),
        });

        const saved = await this.semesterRepository.save(semester);
        return toSemesterResponse(saved);
    }
}
