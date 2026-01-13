import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { Prisma, Role as PrismaRole } from '@prisma/client';
import {
    User,
    RoleType,
    IUserRepository,
    FindPaginatedOptions,
    PaginatedResult,
} from '../domain';

/**
 * Prisma User Repository (Adapter)
 * Implements the domain's IUserRepository interface
 */
@Injectable()
export class PrismaUserRepository implements IUserRepository {
    constructor(private readonly prisma: PrismaService) { }

    async save(user: User): Promise<User> {
        const data = {
            email: user.email.value,
            fullName: user.fullName,
            code: user.code?.value ?? null,
            avatarUrl: user.avatarUrl,
            isActive: user.isActive,
            role: (user.role?.value as PrismaRole) ?? null,
        };

        const result = await this.prisma.user.upsert({
            where: { id: user.id },
            create: { id: user.id, ...data },
            update: data,
        });

        return this.toDomain(result);
    }

    async delete(id: string): Promise<void> {
        await this.prisma.user.delete({ where: { id } });
    }

    async findById(id: string): Promise<User | null> {
        const result = await this.prisma.user.findUnique({ where: { id } });
        return result ? this.toDomain(result) : null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const result = await this.prisma.user.findUnique({ where: { email } });
        return result ? this.toDomain(result) : null;
    }

    async findByCode(code: string): Promise<User | null> {
        const result = await this.prisma.user.findFirst({ where: { code } });
        return result ? this.toDomain(result) : null;
    }

    async findByRole(role: RoleType): Promise<User[]> {
        const results = await this.prisma.user.findMany({
            where: { role: role as PrismaRole },
            orderBy: { createdAt: 'desc' },
        });
        return results.map((r) => this.toDomain(r));
    }

    async findPaginated(options: FindPaginatedOptions): Promise<PaginatedResult<User>> {
        const { page, limit } = options;
        const skip = (page - 1) * limit;
        const where = this.buildWhere(options);

        const [results, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count({ where }),
        ]);

        return {
            data: results.map((r) => this.toDomain(r)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async exists(id: string): Promise<boolean> {
        const count = await this.prisma.user.count({ where: { id } });
        return count > 0;
    }

    async emailExists(email: string, excludeId?: string): Promise<boolean> {
        const count = await this.prisma.user.count({
            where: { email, ...(excludeId && { id: { not: excludeId } }) },
        });
        return count > 0;
    }

    async codeExists(code: string, excludeId?: string): Promise<boolean> {
        const count = await this.prisma.user.count({
            where: { code, ...(excludeId && { id: { not: excludeId } }) },
        });
        return count > 0;
    }

    async countByRole(role: RoleType): Promise<number> {
        return this.prisma.user.count({ where: { role: role as PrismaRole } });
    }

    async countAll(): Promise<number> {
        return this.prisma.user.count();
    }

    // ==================== PRIVATE ====================

    private buildWhere(options: FindPaginatedOptions): Prisma.UserWhereInput {
        const where: Prisma.UserWhereInput = {};
        if (options.role) where.role = options.role as PrismaRole;
        if (options.isActive !== undefined) where.isActive = options.isActive;
        if (options.search) {
            where.OR = [
                { email: { contains: options.search, mode: 'insensitive' } },
                { fullName: { contains: options.search, mode: 'insensitive' } },
                { code: { contains: options.search, mode: 'insensitive' } },
            ];
        }
        return where;
    }

    private toDomain(data: {
        id: string;
        email: string;
        fullName: string | null;
        code: string | null;
        avatarUrl: string | null;
        isActive: boolean;
        role: PrismaRole | null;
        createdAt: Date;
        updatedAt: Date;
    }): User {
        return User.fromPersistence({
            id: data.id,
            email: data.email,
            fullName: data.fullName,
            code: data.code,
            avatarUrl: data.avatarUrl,
            isActive: data.isActive,
            role: data.role,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
        });
    }
}
