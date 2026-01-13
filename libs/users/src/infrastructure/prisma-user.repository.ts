import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { Prisma, Role as PrismaRole } from '@prisma/client';
import {
    User,
    UserActivity,
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

    async findOne(query: { id?: string; email?: string; code?: string }): Promise<User | null> {
        const { id, email, code } = query;
        const result = await this.prisma.user.findFirst({
            where: {
                OR: [
                    ...(id ? [{ id }] : []),
                    ...(email ? [{ email }] : []),
                    ...(code ? [{ code }] : []),
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

    async exists(query: { id?: string; email?: string; code?: string }, excludeId?: string): Promise<boolean> {
        const { id, email, code } = query;
        const count = await this.prisma.user.count({
            where: {
                OR: [
                    ...(id ? [{ id }] : []),
                    ...(email ? [{ email }] : []),
                    ...(code ? [{ code }] : []),
                ],
                ...(excludeId && { id: { not: excludeId } }),
            },
        });
        return count > 0;
    }

    async count(query?: { role?: RoleType; isActive?: boolean; search?: string }): Promise<number> {
        const where = query ? this.buildWhere(query) : {};
        return this.prisma.user.count({ where });
    }

    async saveActivity(activity: UserActivity): Promise<void> {
        await this.prisma.userActivity.create({
            data: {
                id: activity.id,
                userId: activity.userId,
                type: activity.type,
                details: activity.details,
                performer: activity.performer,
                timestamp: activity.timestamp,
            },
        });
    }

    async findActivitiesByUserId(userId: string): Promise<UserActivity[]> {
        const results = await this.prisma.userActivity.findMany({
            where: { userId },
            orderBy: { timestamp: 'desc' },
        });

        return results.map((r) =>
            UserActivity.create({
                id: r.id,
                userId: r.userId,
                type: r.type,
                details: r.details ?? undefined,
                performer: r.performer,
                timestamp: r.timestamp,
            }),
        );
    }

    async findGlobalActivities(limit: number): Promise<UserActivity[]> {
        const results = await this.prisma.userActivity.findMany({
            take: limit,
            orderBy: { timestamp: 'desc' },
        });

        return results.map((r) =>
            UserActivity.create({
                id: r.id,
                userId: r.userId,
                type: r.type,
                details: r.details ?? undefined,
                performer: r.performer,
                timestamp: r.timestamp,
            }),
        );
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
