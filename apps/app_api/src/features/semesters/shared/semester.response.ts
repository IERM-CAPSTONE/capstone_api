import { ApiProperty } from '@nestjs/swagger';
import { Semester } from '@app/semesters';

export class SemesterResponse {
    @ApiProperty()
    id: string;

    @ApiProperty()
    code: string;

    @ApiProperty({ required: false, nullable: true })
    name: string | null;

    @ApiProperty()
    startDate: Date;

    @ApiProperty()
    endDate: Date;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

export class SemesterPaginationResponse {
    @ApiProperty({ type: [SemesterResponse] })
    data: SemesterResponse[];

    @ApiProperty()
    total: number;

    @ApiProperty()
    page: number;

    @ApiProperty()
    limit: number;

    @ApiProperty()
    totalPages: number;
}

export function toSemesterResponse(semester: Semester): SemesterResponse {
    return {
        id: semester.id,
        code: semester.code,
        name: semester.name,
        startDate: semester.startDate,
        endDate: semester.endDate,
        createdAt: semester.createdAt,
        updatedAt: semester.updatedAt,
    };
}
