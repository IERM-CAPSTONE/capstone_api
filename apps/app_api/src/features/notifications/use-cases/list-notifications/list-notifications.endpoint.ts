import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ListNotificationsHandler } from './list-notifications.handler';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT-auth')
export class ListNotificationsEndpoint {
    constructor(private readonly handler: ListNotificationsHandler) {}

    @Get()
    @ApiOperation({ summary: 'Get current user notifications' })
    @ApiResponse({ status: 200, description: 'List of notifications' })
    async list(@Req() req: any) {
        const userId = req.user?.userId;
        return this.handler.execute(userId);
    }
}
