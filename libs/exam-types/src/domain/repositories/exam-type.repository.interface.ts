import { ExamType } from '../entities/exam-type.entity';

export interface IExamTypeRepository {
    save(examType: ExamType): Promise<ExamType>;
    findById(id: string): Promise<ExamType | null>;
    findByCode(code: string): Promise<ExamType | null>;
    findAll(): Promise<ExamType[]>;
    exists(query: { id?: string; code?: string }): Promise<boolean>;
    delete(id: string): Promise<void>;
}

export const EXAM_TYPE_REPOSITORY = Symbol('EXAM_TYPE_REPOSITORY');
