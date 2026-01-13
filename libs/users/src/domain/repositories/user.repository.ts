import { User } from '../entities/user.entity';
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

    // Existence and Counts
    exists(query: { id?: string; email?: string; code?: string }, excludeId?: string): Promise<boolean>;
    count(query?: { role?: RoleType; isActive?: boolean; search?: string }): Promise<number>;
}

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
