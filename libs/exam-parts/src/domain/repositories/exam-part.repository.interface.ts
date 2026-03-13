import { ExamPart } from '../entities/exam-part.entity';

export interface IExamPartRepository {
    save(examPart: ExamPart): Promise<ExamPart>;
    findById(id: string): Promise<ExamPart | null>;
    findByCode(code: string): Promise<ExamPart | null>;
    findAll(): Promise<ExamPart[]>;
    exists(query: { id?: string; code?: string }): Promise<boolean>;
    delete(id: string): Promise<void>;
}

export const EXAM_PART_REPOSITORY = Symbol('EXAM_PART_REPOSITORY');
