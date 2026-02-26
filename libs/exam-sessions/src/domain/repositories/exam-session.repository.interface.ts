import { ExamSession } from '../entities';

export interface IExamSessionRepository {
    save(session: ExamSession): Promise<ExamSession>;
    findById(id: string): Promise<ExamSession | null>;
    findMany(query?: {
        subjectCode?: string;
        examCode?: string;
        date?: string;
        time?: string;
        status?: string;
        fromDate?: string;
        toDate?: string;
        startTime?: string;
        endTime?: string;
        examRoomId?: string;
        proctorId?: string;
        studentId?: string;
        semester?: string;
        skip?: number;
        take?: number;
    }): Promise<ExamSession[]>;
    findOne(query: {
        id?: string;
        subjectCode?: string;
        examRoomId?: string;
        proctorId?: string;
    }): Promise<ExamSession | null>;
    exists(id: string): Promise<boolean>;
    count(query?: {
        subjectCode?: string;
        examCode?: string;
        date?: string;
        time?: string;
        status?: string;
        fromDate?: string;
        toDate?: string;
        startTime?: string;
        endTime?: string;
        examRoomId?: string;
        proctorId?: string;
        studentId?: string;
    }): Promise<number>;

    /**
     * Tìm các phiên thi bị trùng lịch (overlap)
     */
    findOverlapping(params: {
        startTime: Date;
        endTime: Date;
        examRoomId?: string | null;
        proctorId?: string | null;
        hallInvigilatorId?: string | null;
        excludeId?: string;
    }): Promise<ExamSession[]>;

    delete(id: string): Promise<void>;
}

export const EXAM_SESSION_REPOSITORY = Symbol('EXAM_SESSION_REPOSITORY');
