import { Semester } from '../entities/semester.entity';

export interface ISemesterRepository {
    save(semester: Semester): Promise<Semester>;
    findById(id: string): Promise<Semester | null>;
    findByCode(code: string): Promise<Semester | null>;
    findAll(query?: { search?: string, fromDate?: Date, toDate?: Date }): Promise<Semester[]>;
    findAllWithPagination(query: {
        page: number;
        limit: number;
        search?: string;
        fromDate?: Date;
        toDate?: Date;
    }): Promise<{ items: Semester[]; total: number }>;
    exists(query: { id?: string; code?: string }): Promise<boolean>;
    delete(id: string): Promise<void>;
}

export const SEMESTER_REPOSITORY = Symbol('SEMESTER_REPOSITORY');
