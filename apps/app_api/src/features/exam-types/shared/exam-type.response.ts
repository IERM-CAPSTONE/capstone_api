import { ApiProperty } from '@nestjs/swagger';
import { ExamType } from '@app/exam-types';

export class ExamTypeResponse {
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

export function toExamTypeResponse(examType: ExamType): ExamTypeResponse {
    return {
        id: examType.id,
        code: examType.code,
        name: examType.name,
        description: examType.description,
        createdAt: examType.createdAt,
        updatedAt: examType.updatedAt,
    };
}
