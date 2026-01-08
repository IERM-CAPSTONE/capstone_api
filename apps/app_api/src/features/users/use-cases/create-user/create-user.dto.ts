import { RoleType } from '../../domain';

/**
 * Create User - Request DTO
 */
export class CreateUserDto {
    email: string;
    fullName?: string;
    code?: string;
    avatarUrl?: string;
    role?: RoleType;
}
