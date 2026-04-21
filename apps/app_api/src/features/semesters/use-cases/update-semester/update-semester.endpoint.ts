import {
    Controller,
    Patch,
    Param,
    Body,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { Roles } from '../../../../common/decorators';
import { RoleType } from '@app/users';
import { SemesterResponse } from '../../shared/semester.response';
import { UpdateSemesterHandler } from './update-semester.handler';
import { UpdateSemesterDto } from './update-semester.dto';

@ApiTags('Semesters')
@ApiBearerAuth('JWT-auth')
@Controller('semesters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UpdateSemesterEndpoint {
    constructor(private readonly handler: UpdateSemesterHandler) { }

    @Patch(':id')
    @Roles(RoleType.ADMIN)
    @ApiOperation({ summary: 'Update a semester (Admin only)' })
    @ApiResponse({ status: 200, description: 'Semester updated', type: SemesterResponse })
    @ApiResponse({ status: 404, description: 'Semester not found' })
    async handle(
        @Param('id') id: string,
        @Body() dto: UpdateSemesterDto,
    ): Promise<SemesterResponse> {
        return await this.handler.execute(id, dto);
    }
}
