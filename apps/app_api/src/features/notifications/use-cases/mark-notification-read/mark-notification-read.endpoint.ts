import { Controller, Patch, Param, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PrismaService } from 'libs/prisma/prisma.service';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT-auth')
export class MarkNotificationReadEndpoint {
    constructor(private readonly prisma: PrismaService) {}

    @Patch(':id/read')
    @ApiOperation({ summary: 'Mark a notification as read' })
    async markRead(@Param('id') id: string, @Req() req: any) {
        const userId = req.user?.userId;
        const notification = await this.prisma.notification.findFirst({
            where: { id, toUserId: userId },
        });
        if (!notification) throw new NotFoundException('Notification not found');
        return this.prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });
    }
}
