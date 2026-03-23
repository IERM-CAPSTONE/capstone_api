import {
    Controller,
    Delete,
    Param,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { Roles } from '../../../../common/decorators';
import { RoleType } from '@app/users';
import { DeleteTemplateHandler } from './delete-template.handler';

@ApiTags('Announcement Templates')
@ApiBearerAuth('JWT-auth')
@Controller('announcement-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeleteTemplateEndpoint {
    constructor(private readonly handler: DeleteTemplateHandler) { }

    @Delete(':id')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Delete an announcement template (Admin & Officer)' })
    @ApiResponse({ status: 200, description: 'Template deleted successfully' })
    async handle(@Param('id') id: string) {
        return await this.handler.execute({ id });
    }
}
