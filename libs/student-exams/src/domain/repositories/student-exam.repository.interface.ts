import { StudentExam } from '../entities';

export const STUDENT_EXAM_REPOSITORY = Symbol('IStudentExamRepository');

export interface IStudentExamRepository {
    save(studentExam: StudentExam): Promise<StudentExam>;
    findById(id: string): Promise<StudentExam | null>;
    findByExamSessionId(examSessionId: string): Promise<StudentExam[]>;
    findByStudentId(studentId: string): Promise<StudentExam[]>;
    findMany(criteria?: {
        examSessionId?: string;
        studentId?: string;
        studentCode?: string;
        status?: string;
        page?: number;
        limit?: number;
    }): Promise<{ data: StudentExam[]; total: number }>;
    delete(id: string): Promise<void>;
    exists(criteria: { examSessionId: string; studentId: string }): Promise<boolean>;
    checkIn(studentId: string, examSessionId: string, examPartCode?: string): Promise<void>;
}
