import { Injectable } from '@nestjs/common';
import { PrismaService } from 'libs/prisma/prisma.service';

@Injectable()
export class ListNotificationsHandler {
    constructor(private readonly prisma: PrismaService) {}

    async execute(userId: string) {
        return this.prisma.notification.findMany({
            where: {
                toUserId: userId,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 50, // Lấy 50 thông báo gần nhất
        });
    }
}
