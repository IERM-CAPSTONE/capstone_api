import { ApiProperty } from '@nestjs/swagger';
import { User, RoleType } from '../domain';

/**
 * User Response DTO
 */
export class UserResponse {
    @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'User UUID' })
    id: string;

    @ApiProperty({ example: 'user@example.com', description: 'User email address' })
    email: string;

    @ApiProperty({ example: 'John Doe', description: 'Full name', nullable: true })
    fullName: string | null;

    @ApiProperty({ example: 'SE123456', description: 'Student ID (MSSV) or teacher code', nullable: true })
    code: string | null;

    @ApiProperty({ example: 'https://example.com/avatar.jpg', description: 'Avatar URL', nullable: true })
    avatarUrl: string | null;

    @ApiProperty({ example: true, description: 'Whether the user account is active' })
    isActive: boolean;

    @ApiProperty({ example: 'STUDENT', enum: ['ADMIN', 'EXAM_OFFICER', 'PROCTOR', 'STUDENT'], description: 'User role', nullable: true })
    role: RoleType | null;

    @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Account creation timestamp' })
    createdAt: Date;

    @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Last update timestamp' })
    updatedAt: Date;
}

/**
 * Map User aggregate to Response DTO
 */
export function toUserResponse(user: User): UserResponse {
    return {
        id: user.id,
        email: user.email.value,
        fullName: user.fullName,
        code: user.code?.value ?? null,
        avatarUrl: user.avatarUrl,
        isActive: user.isActive,
        role: user.role?.value ?? null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

/**
 * Paginated Response
 */
export class PaginatedUserResponse {
    @ApiProperty({ type: [UserResponse], description: 'Array of users' })
    data: UserResponse[];

    @ApiProperty({ example: 100, description: 'Total number of users' })
    total: number;

    @ApiProperty({ example: 1, description: 'Current page number' })
    page: number;

    @ApiProperty({ example: 10, description: 'Number of items per page' })
    limit: number;

    @ApiProperty({ example: 10, description: 'Total number of pages' })
    totalPages: number;
}
