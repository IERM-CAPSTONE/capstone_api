import {
    Controller,
    Delete,
    Param,
    NotFoundException,
    BadRequestException,
    UseGuards,
    HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { DeleteSubjectHandler } from './delete-subject.handler';

@ApiTags('Subjects')
@ApiBearerAuth('JWT-auth')
@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeleteSubjectEndpoint {
    constructor(private readonly handler: DeleteSubjectHandler) { }

    @Delete(':id')
    @Roles(RoleType.ADMIN)
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete a subject' })
    @ApiResponse({ status: 204, description: 'Subject deleted successfully' })
    @ApiResponse({ status: 404, description: 'Subject not found' })
    async handle(@Param('id') id: string): Promise<void> {
        try {
            await this.handler.execute(id);
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            if (error instanceof Error) {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }
}
