import {
    Controller,
    Post,
    Body,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { Roles } from '../../../../common/decorators';
import { RoleType } from '@app/users';
import { BroadcastAnnouncementHandler } from './broadcast-announcement.handler';
import { BroadcastAnnouncementDto } from '../../shared/announcement-template.dto';

@ApiTags('Announcement Templates')
@ApiBearerAuth('JWT-auth')
@Controller('broadcast')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BroadcastAnnouncementEndpoint {
    constructor(private readonly handler: BroadcastAnnouncementHandler) { }

    @Post()
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Broadcast an announcement' })
    @ApiResponse({ status: 200, description: 'Broadcasted' })
    async handle(@Body() dto: BroadcastAnnouncementDto) {
        return await this.handler.execute(dto);
    }
}
