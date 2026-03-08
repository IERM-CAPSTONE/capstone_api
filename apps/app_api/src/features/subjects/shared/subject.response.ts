import { ApiProperty } from '@nestjs/swagger';
import { Subject, SubjectPart } from '@app/subjects';

export class SubjectPartResponse {
    @ApiProperty()
    id: string;

    @ApiProperty()
    examPartId: string;

    @ApiProperty({ required: false, nullable: true })
    duration: number | null;

    @ApiProperty({ required: false, nullable: true })
    examPart?: {
        id: string;
        code: string;
        name: string | null;
    } | null;
}

export class SubjectResponse {
    @ApiProperty()
    id: string;

    @ApiProperty()
    code: string;

    @ApiProperty({ required: false, nullable: true })
    name: string | null;

    @ApiProperty({ required: false, nullable: true })
    semesterId: string | null;

    @ApiProperty({ required: false, nullable: true })
    department: string | null;

    @ApiProperty()
    isCoursera: boolean;

    @ApiProperty({ required: false, nullable: true })
    semester?: {
        id: string;
        code: string;
        name: string;
    } | null;

    @ApiProperty({ type: [SubjectPartResponse] })
    parts: SubjectPartResponse[];

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

export class SubjectPaginationResponse {
    @ApiProperty({ type: [SubjectResponse] })
    data: SubjectResponse[];

    @ApiProperty()
    total: number;

    @ApiProperty()
    page: number;

    @ApiProperty()
    limit: number;

    @ApiProperty()
    totalPages: number;
}

export function toSubjectResponse(subject: Subject): SubjectResponse {
    return {
        id: subject.id,
        code: subject.code,
        name: subject.name,
        semesterId: subject.semesterId,
        semester: subject.semester ? {
            id: subject.semester.id,
            code: subject.semester.code,
            name: subject.semester.name,
        } : null,
        department: subject.department,
        isCoursera: subject.isCoursera,
        parts: subject.parts.map(p => ({
            id: p.id,
            examPartId: p.examPartId,
            duration: p.duration,
            examPart: p.examPart ? {
                id: p.examPart.id,
                code: p.examPart.code,
                name: p.examPart.name,
            } : null,
        })),
        createdAt: subject.createdAt,
        updatedAt: subject.updatedAt,
    };
}
