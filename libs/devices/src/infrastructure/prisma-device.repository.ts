import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { Device } from '../domain/entities';
import { IDeviceRepository } from '../domain/repositories';

@Injectable()
export class PrismaDeviceRepository implements IDeviceRepository {
    constructor(private readonly prisma: PrismaService) { }

    async save(device: Device): Promise<Device> {
        const data = {
            name: device.name,
            serial: device.serial,
            metadata: device.metadata as any,
            isActive: device.isActive,
            updatedAt: device.updatedAt,
        };

        const saved = await this.prisma.device.upsert({
            where: { id: device.id },
            create: {
                id: device.id,
                ...data,
                ownerId: device.ownerId,
                createdAt: device.createdAt,
            },
            update: data,
        });

        return Device.mapFromPrisma(saved);
    }

    async findById(id: string): Promise<Device | null> {
        const found = await this.prisma.device.findUnique({ where: { id } });
        return found ? Device.mapFromPrisma(found) : null;
    }

    async findMany(query?: {
        ownerId?: string;
        serial?: string;
        isActive?: boolean;
        skip?: number;
        take?: number;
    }): Promise<Device[]> {
        const where: any = {};
        if (query?.ownerId) where.ownerId = query.ownerId;
        if (query?.serial) where.serial = query.serial;
        if (query?.isActive !== undefined) where.isActive = query.isActive;

        const skipVal = isNaN(query?.skip) || query?.skip < 0 ? 0 : Math.floor(query?.skip ?? 0);
        const takeVal = isNaN(query?.take) || (query?.take ?? 0) <= 0 ? undefined : Math.floor(query?.take ?? 0);

        const found = await this.prisma.device.findMany({
            where,
            skip: skipVal,
            take: takeVal,
            orderBy: { createdAt: 'desc' },
        });

        return found.map(item => Device.mapFromPrisma(item));
    }

    async findOne(query: { id?: string; serial?: string; ownerId?: string }): Promise<Device | null> {
        const where: any = {};
        if (query.id) where.id = query.id;
        if (query.serial) where.serial = query.serial;
        if (query.ownerId) where.ownerId = query.ownerId;

        const found = await this.prisma.device.findFirst({ where });
        return found ? Device.mapFromPrisma(found) : null;
    }

    async exists(query: { id?: string; serial?: string }): Promise<boolean> {
        const where: any = {};
        if (query.id) where.id = query.id;
        if (query.serial) where.serial = query.serial;

        const count = await this.prisma.device.count({ where });
        return count > 0;
    }

    async count(query?: { ownerId?: string; isActive?: boolean }): Promise<number> {
        const where: any = {};
        if (query?.ownerId) where.ownerId = query.ownerId;
        if (query?.isActive !== undefined) where.isActive = query.isActive;

        return this.prisma.device.count({ where });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.device.delete({ where: { id } });
    }
}
