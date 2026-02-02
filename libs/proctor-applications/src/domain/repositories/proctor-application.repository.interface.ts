import { ProctorApplication } from '../entities';

export const PROCTOR_APPLICATION_REPOSITORY = 'PROCTOR_APPLICATION_REPOSITORY';

export interface IProctorApplicationRepository {
    save(application: ProctorApplication): Promise<ProctorApplication>;
    findById(id: string): Promise<ProctorApplication | null>;
    findByTeacherId(teacherId: string): Promise<ProctorApplication[]>;
    findMany(criteria?: {
        teacherId?: string;
        status?: string;
        semesterCode?: string;
        preferredDateStart?: Date;
        preferredDateEnd?: Date;
        page?: number;
        limit?: number;
    }): Promise<{ data: ProctorApplication[]; total: number }>;
    delete(id: string): Promise<void>;
}
