import { User } from '../entities';
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
    findOne(query: { id?: string; email?: string; code?: string; username?: string }, excludeId?: string): Promise<User | null>;
    findMany(query: { role?: RoleType; isActive?: boolean; search?: string }): Promise<User[]>;
    findPaginated(options: FindPaginatedOptions): Promise<PaginatedResult<User>>;

    // Counts
    countByRole(role: RoleType): Promise<number>;
    countAll(): Promise<number>;
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
