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
import { DeleteExamPartHandler } from './delete-exam-part.handler';

@ApiTags('ExamParts')
@ApiBearerAuth('JWT-auth')
@Controller('exam-parts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeleteExamPartEndpoint {
    constructor(private readonly handler: DeleteExamPartHandler) { }

    @Delete(':id')
    @Roles(RoleType.ADMIN)
    @HttpCode(204)
    @ApiOperation({ summary: 'Delete an exam type' })
    @ApiResponse({ status: 204, description: 'Exam type deleted successfully' })
    @ApiResponse({ status: 404, description: 'Exam type not found' })
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
