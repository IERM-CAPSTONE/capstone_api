import {
    Controller,
    Get,
    Param,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { Roles } from '../../../../common/decorators';
import { RoleType } from '@app/users';
import { SemesterResponse } from '../../shared/semester.response';
import { GetSemesterHandler } from './get-semester.handler';

@ApiTags('Semesters')
@ApiBearerAuth('JWT-auth')
@Controller('semesters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GetSemesterEndpoint {
    constructor(private readonly handler: GetSemesterHandler) { }

    @Get(':id')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Get a semester by ID (Admin & Officer)' })
    @ApiResponse({ status: 200, description: 'Semester details', type: SemesterResponse })
    @ApiResponse({ status: 404, description: 'Semester not found' })
    async handle(@Param('id') id: string): Promise<SemesterResponse> {
        return await this.handler.execute(id);
    }
}
