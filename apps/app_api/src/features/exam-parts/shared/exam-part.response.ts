import { ApiProperty } from '@nestjs/swagger';
import { ExamPart } from '@app/exam-parts';

export class ExamPartResponse {
    @ApiProperty({ example: 'uuid-123', description: 'Exam type ID' })
    id: string;

    @ApiProperty({ example: 'MC', description: 'Exam type code' })
    code: string;

    @ApiProperty({ example: 'Multiple Choice', description: 'Exam type name', required: false })
    name: string | null;

    @ApiProperty({ example: 'Theory exam with multiple choice questions', description: 'Description', required: false })
    description: string | null;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

export function toExamPartResponse(examPart: ExamPart): ExamPartResponse {
    return {
        id: examPart.id,
        code: examPart.code,
        name: examPart.name,
        description: examPart.description,
        createdAt: examPart.createdAt,
        updatedAt: examPart.updatedAt,
    };
}
