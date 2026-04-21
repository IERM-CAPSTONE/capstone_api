import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { DeviceApplication } from '../domain/entities';
import { IDeviceApplicationRepository } from '../domain/repositories';

@Injectable()
export class PrismaDeviceApplicationRepository implements IDeviceApplicationRepository {
    constructor(private readonly prisma: PrismaService) { }

    async save(application: DeviceApplication): Promise<DeviceApplication> {
        const data = {
            status: application.status as any,
            approvedAt: application.approvedAt,
            rejectedReason: application.rejectedReason,
            updatedAt: application.updatedAt,
        };

        const updateData = {
            ...data,
            approvedBy: application.approvedBy,
        };

        const saved = await this.prisma.deviceApplication.upsert({
            where: { id: application.id },
            create: {
                id: application.id,
                ...data,
                createdAt: application.createdAt,
                device: {
                    connect: { id: application.deviceId },
                },
                registeredUser: {
                    connect: { id: application.registeredBy },
                },
                ...(application.approvedBy
                    ? {
                        approvedUser: {
                            connect: { id: application.approvedBy },
                        },
                    }
                    : {}),
            },
            update: updateData,
        });

        return DeviceApplication.mapFromPrisma(saved);
    }

    async findById(id: string): Promise<DeviceApplication | null> {
        const found = await this.prisma.deviceApplication.findUnique({ where: { id } });
        return found ? DeviceApplication.mapFromPrisma(found) : null;
    }

    async findMany(query?: {
        deviceId?: string;
        registeredBy?: string;
        status?: string;
        skip?: number;
        take?: number;
    }): Promise<DeviceApplication[]> {
        const where: any = {};
        if (query?.deviceId) where.deviceId = query.deviceId;
        if (query?.registeredBy) where.registeredBy = query.registeredBy;
        if (query?.status) where.status = query.status as any;

        const skipVal = isNaN(query?.skip) || query?.skip < 0 ? 0 : Math.floor(query?.skip ?? 0);
        const takeVal = isNaN(query?.take) || (query?.take ?? 0) <= 0 ? undefined : Math.floor(query?.take ?? 0);

        const found = await this.prisma.deviceApplication.findMany({
            where,
            skip: skipVal,
            take: takeVal,
            orderBy: { createdAt: 'desc' },
        });

        return found.map(item => DeviceApplication.mapFromPrisma(item));
    }

    async findOne(query: { id?: string; deviceId?: string; registeredBy?: string; status?: string }): Promise<DeviceApplication | null> {
        const where: any = {};
        if (query.id) where.id = query.id;
        if (query.deviceId) where.deviceId = query.deviceId;
        if (query.registeredBy) where.registeredBy = query.registeredBy;
        if (query.status) where.status = query.status as any;

        const found = await this.prisma.deviceApplication.findFirst({ where });
        return found ? DeviceApplication.mapFromPrisma(found) : null;
    }

    async exists(query: { id?: string; deviceId?: string }): Promise<boolean> {
        const where: any = {};
        if (query.id) where.id = query.id;
        if (query.deviceId) where.deviceId = query.deviceId;

        const count = await this.prisma.deviceApplication.count({ where });
        return count > 0;
    }

    async count(query?: { deviceId?: string; registeredBy?: string; status?: string }): Promise<number> {
        const where: any = {};
        if (query?.deviceId) where.deviceId = query.deviceId;
        if (query?.registeredBy) where.registeredBy = query.registeredBy;
        if (query?.status) where.status = query.status as any;

        return this.prisma.deviceApplication.count({ where });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.deviceApplication.delete({ where: { id } });
    }
}
