import { ExamSession } from '../entities';

export interface IExamSessionRepository {
    save(session: ExamSession): Promise<ExamSession>;
    findById(id: string): Promise<ExamSession | null>;
    findMany(query?: {
        semesterCode?: string;
        examRoomId?: string;
        proctorId?: string;
        skip?: number;
        take?: number;
    }): Promise<ExamSession[]>;
    exists(id: string): Promise<boolean>;
    count(query?: {
        semesterCode?: string;
        examRoomId?: string;
        proctorId?: string;
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
