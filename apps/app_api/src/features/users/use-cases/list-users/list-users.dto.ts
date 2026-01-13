import { RoleType } from '@app/users';

export class ListUsersDto {
    page?: number;
    limit?: number;
    role?: RoleType;
    isActive?: boolean;
    search?: string;
}
