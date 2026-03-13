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
import { SemesterResponse } from '../../shared/semester.response';
import { CreateSemesterHandler } from './create-semester.handler';
import { CreateSemesterDto } from './create-semester.dto';

@ApiTags('Semesters')
@ApiBearerAuth('JWT-auth')
@Controller('semesters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CreateSemesterEndpoint {
    constructor(private readonly handler: CreateSemesterHandler) { }

    @Post()
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Create a new semester (Admin & Officer)' })
    @ApiResponse({ status: 201, description: 'Semester created', type: SemesterResponse })
    @ApiResponse({ status: 409, description: 'Semester code already exists' })
    async handle(@Body() dto: CreateSemesterDto): Promise<SemesterResponse> {
        return await this.handler.execute(dto);
    }
}
