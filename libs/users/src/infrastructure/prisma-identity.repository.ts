import { Injectable } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { IIdentityRepository } from '../domain/repositories/identity.repository';
import { Identity } from '../domain/entities/identity.entity';

@Injectable()
export class PrismaIdentityRepository implements IIdentityRepository {
    constructor(private readonly prisma: PrismaService) { }

    async findByStudentId(studentId: string): Promise<Identity | null> {
        const result = await this.prisma.identity.findUnique({
            where: { studentId },
        });
        return result ? Identity.fromPersistence(result) : null;
    }

    async save(identity: any): Promise<Identity> {
        // Basic implementation for now if needed
        const result = await this.prisma.identity.upsert({
            where: { studentId: identity.studentId },
            create: identity,
            update: identity,
        });
        return Identity.fromPersistence(result);
    }
}
