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
            email: user.email?.value,
            fullName: user.fullName,
            username: user.username,
            code: user.code?.value,
            avatarUrl: user.avatarUrl,
            isActive: user.isActive,
            campus: user.campus as any,
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

    async findOne(query: { id?: string; email?: string; code?: string; username?: string }, excludeId?: string): Promise<User | null> {
        const { id, email, code, username } = query;
        const result = await this.prisma.user.findFirst({
            where: {
                AND: [
                    {
                        OR: [
                            ...(id ? [{ id }] : []),
                            ...(email ? [{ email }] : []),
                            ...(code ? [{ code }] : []),
                            ...(username ? [{ username }] : []),
                        ],
                    },
                    ...(excludeId ? [{ id: { not: excludeId } }] : []),
                ],
            },
        });
        return result ? this.toDomain(result) : null;
    }

    async findMany(query: { role?: RoleType; isActive?: boolean; search?: string }): Promise<User[]> {
        const where = this.buildWhere(query);
        const results = await this.prisma.user.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
        return results.map((r) => this.toDomain(r));
    }

    async findByCodes(codes: string[]): Promise<User[]> {
        const results = await this.prisma.user.findMany({
            where: {
                code: {
                    in: codes,
                },
            },
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
                orderBy: { createdAt: 'asc' },
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

    async countByRole(role: RoleType): Promise<number> {
        return this.prisma.user.count({
            where: { role: role as PrismaRole },
        });
    }

    async countAll(): Promise<number> {
        return this.prisma.user.count();
    }

    // ==================== PRIVATE ====================

    private buildWhere(options: { role?: RoleType; isActive?: boolean; search?: string }): Prisma.UserWhereInput {
        const where: Prisma.UserWhereInput = {};
        if (options.role) where.role = options.role as PrismaRole;
        if (options.isActive !== undefined) where.isActive = options.isActive;
        if (options.search) {
            where.OR = [
                { email: { contains: options.search, mode: 'insensitive' } },
                { fullName: { contains: options.search, mode: 'insensitive' } },
                { code: { contains: options.search, mode: 'insensitive' } },
                { username: { contains: options.search, mode: 'insensitive' } },
            ];
        }
        return where;
    }

    private toDomain(model: {
        id: string;
        email: string | null;
        fullName: string | null;
        username: string | null;
        code: string | null;
        avatarUrl: string | null;
        isActive: boolean;
        role: PrismaRole | null;
        campus: string | null;
        createdAt: Date;
        updatedAt: Date;
    }): User {
        return User.fromPersistence({
            id: model.id,
            email: model.email,
            fullName: model.fullName,
            username: model.username,
            code: model.code,
            avatarUrl: model.avatarUrl,
            isActive: model.isActive,
            role: model.role,
            campus: model.campus,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
        });
    }
}
