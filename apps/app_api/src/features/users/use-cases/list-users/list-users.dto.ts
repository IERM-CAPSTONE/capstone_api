import { RoleType } from '../../domain';

export class ListUsersDto {
    page?: number;
    limit?: number;
    role?: RoleType;
    isActive?: boolean;
    search?: string;
}
