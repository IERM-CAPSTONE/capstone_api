import { ExamRoom } from '../entities';

/**
 * ExamRoom Repository Interface (Port)
 * Defines the contract for persistence operations
 */
export interface IExamRoomRepository {
    /**
     * Save an exam room (create or update)
     */
    save(examRoom: ExamRoom): Promise<ExamRoom>;

    /**
     * Find an exam room by ID
     */
    findById(id: string): Promise<ExamRoom | null>;

    /**
     * Find exam rooms matching criteria
     */
    findMany(query?: {
        roomNumber?: string;
        skip?: number;
        take?: number;
    }): Promise<ExamRoom[]>;

    /**
     * Find a single exam room by criteria
     */
    findOne(query: { roomNumber: string }): Promise<ExamRoom | null>;

    /**
     * Check if an exam room exists
     */
    exists(query: { id?: string; roomNumber?: string }): Promise<boolean>;

    /**
     * Count exam rooms
     */
    count(query?: { roomNumber?: string }): Promise<number>;

    /**
     * Delete an exam room by ID
     */
    delete(id: string): Promise<void>;
}

/**
 * Injection token for ExamRoom Repository
 */
export const EXAM_ROOM_REPOSITORY = Symbol('EXAM_ROOM_REPOSITORY');
