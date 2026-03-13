import {
    Controller,
    Patch,
    Body,
    Param,
    NotFoundException,
    BadRequestException,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { SubjectResponse } from '../../shared/subject.response';
import { UpdateSubjectDto } from './update-subject.dto';
import { UpdateSubjectHandler } from './update-subject.handler';

@ApiTags('Subjects')
@ApiBearerAuth('JWT-auth')
@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UpdateSubjectEndpoint {
    constructor(private readonly handler: UpdateSubjectHandler) { }

    @Patch(':id')
    @Roles(RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Update a subject' })
    @ApiBody({ type: UpdateSubjectDto })
    @ApiResponse({ status: 200, description: 'Subject updated successfully', type: SubjectResponse })
    @ApiResponse({ status: 404, description: 'Subject not found' })
    async handle(@Param('id') id: string, @Body() dto: UpdateSubjectDto): Promise<SubjectResponse> {
        try {
            return await this.handler.execute(id, dto);
        } catch (error) {
            if (error instanceof NotFoundException) throw error;
            if (error instanceof Error) {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }
}
