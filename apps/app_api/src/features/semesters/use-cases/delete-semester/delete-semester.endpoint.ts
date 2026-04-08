import {
    Controller,
    Delete,
    Param,
    HttpCode,
    HttpStatus,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { Roles } from '../../../../common/decorators';
import { RoleType } from '@app/users';
import { DeleteSemesterHandler } from './delete-semester.handler';

@ApiTags('Semesters')
@ApiBearerAuth('JWT-auth')
@Controller('semesters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeleteSemesterEndpoint {
    constructor(private readonly handler: DeleteSemesterHandler) { }

    @Delete(':id')
    @Roles(RoleType.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a semester (Admin only)' })
    @ApiResponse({ status: 204, description: 'Semester deleted' })
    @ApiResponse({ status: 404, description: 'Semester not found' })
    async handle(@Param('id') id: string): Promise<void> {
        return await this.handler.execute(id);
    }
}
