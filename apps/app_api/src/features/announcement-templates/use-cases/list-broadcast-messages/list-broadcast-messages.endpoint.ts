import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { Roles } from '../../../../common/decorators';
import { RoleType } from '@app/users';
import { ListBroadcastMessagesHandler } from './list-broadcast-messages.handler';
import { BroadcastMessageItem, ListBroadcastMessagesQueryDto } from './list-broadcast-messages.dto';

@ApiTags('Announcement Templates')
@ApiBearerAuth('JWT-auth')
@Controller('broadcast')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ListBroadcastMessagesEndpoint {
    constructor(private readonly handler: ListBroadcastMessagesHandler) {}

    @Get('messages')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'List persisted broadcast messages for current user' })
    @ApiResponse({ status: 200, description: 'Broadcast messages listed' })
    async handle(@Req() req: any, @Query() query: ListBroadcastMessagesQueryDto): Promise<BroadcastMessageItem[]> {
        return this.handler.execute(req.user?.userId, query);
    }
}
