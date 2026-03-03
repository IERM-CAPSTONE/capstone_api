import { ApiProperty } from '@nestjs/swagger';
import { Subject, SubjectPart } from '@app/subjects';

export class SubjectPartResponse {
    @ApiProperty()
    id: string;

    @ApiProperty()
    examTypeId: string;

    @ApiProperty({ required: false, nullable: true })
    duration: number | null;

    @ApiProperty({ required: false, nullable: true })
    examType?: {
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
        department: subject.department,
        parts: subject.parts.map(p => ({
            id: p.id,
            examTypeId: p.examTypeId,
            duration: p.duration,
            examType: p.examType ? {
                id: p.examType.id,
                code: p.examType.code,
                name: p.examType.name,
            } : null,
        })),
        createdAt: subject.createdAt,
        updatedAt: subject.updatedAt,
    };
}
