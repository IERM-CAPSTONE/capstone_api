import { Subject } from '../entities/subject.entity';
import { SubjectPart } from '../entities/subject-part.entity';

export interface ISubjectRepository {
    save(subject: Subject): Promise<Subject>;
    findById(id: string): Promise<Subject | null>;
    findByCode(code: string): Promise<Subject | null>;
    findAll(query?: { semesterId?: string; department?: string }): Promise<Subject[]>;
    findAllWithPagination(query?: {
        semesterId?: string;
        department?: string;
        page: number;
        limit: number;
        search?: string;
    }): Promise<{ items: Subject[]; total: number }>;
    exists(query: { id?: string; code?: string }): Promise<boolean>;
    delete(id: string): Promise<void>;

    // Subject Parts
    savePart(part: SubjectPart): Promise<SubjectPart>;
    deletePart(id: string): Promise<void>;
    deleteAllPartsBySubjectId(subjectId: string): Promise<void>;
}

export const SUBJECT_REPOSITORY = Symbol('SUBJECT_REPOSITORY');
