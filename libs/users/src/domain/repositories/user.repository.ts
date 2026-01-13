import { User, UserActivity } from '../entities';
import { RoleType } from '../value-objects/role.vo';

/**
 * User Repository Interface (Port)
 * Domain layer defines WHAT operations are needed
 * Infrastructure layer implements HOW
 */
export interface IUserRepository {
    // Commands
    save(user: User): Promise<User>;
    delete(id: string): Promise<void>;

    // Queries
    findOne(query: { id?: string; email?: string; code?: string }): Promise<User | null>;
    findMany(query: { role?: RoleType; isActive?: boolean; search?: string }): Promise<User[]>;
    findPaginated(options: FindPaginatedOptions): Promise<PaginatedResult<User>>;
    // Existence checks
    exists(id: string): Promise<boolean>;
    emailExists(email: string, excludeId?: string): Promise<boolean>;
    codeExists(code: string, excludeId?: string): Promise<boolean>;

    // Counts
    countByRole(role: RoleType): Promise<number>;
    countAll(): Promise<number>;

    // Activity Logs
    saveActivity(activity: UserActivity): Promise<void>;
    findActivitiesByUserId(userId: string): Promise<UserActivity[]>;
    findGlobalActivities(limit: number): Promise<UserActivity[]>;

export interface FindPaginatedOptions {
    page: number;
    limit: number;
    role?: RoleType;
    isActive?: boolean;
    search?: string;
}

export interface PaginatedResult<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export const USER_REPOSITORY = Symbol('IUserRepository');
