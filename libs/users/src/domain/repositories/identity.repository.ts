import { Identity } from '../entities';

export interface IIdentityRepository {
    findByStudentId(studentId: string): Promise<Identity | null>;
    save(identity: any): Promise<Identity>;
}

export const IDENTITY_REPOSITORY = Symbol('IIdentityRepository');
