import {
    Controller,
    Post,
    Body,
    ConflictException,
    BadRequestException,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { SubjectResponse } from '../../shared/subject.response';
import { CreateSubjectDto } from './create-subject.dto';
import { CreateSubjectHandler } from './create-subject.handler';

@ApiTags('Subjects')
@ApiBearerAuth('JWT-auth')
@Controller('subjects')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CreateSubjectEndpoint {
    constructor(private readonly handler: CreateSubjectHandler) { }

    @Post()
    @Roles(RoleType.ADMIN)
    @ApiOperation({ summary: 'Create a new subject' })
    @ApiBody({ type: CreateSubjectDto })
    @ApiResponse({ status: 201, description: 'Subject created successfully', type: SubjectResponse })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 409, description: 'Subject already exists' })
    async handle(@Body() dto: CreateSubjectDto): Promise<SubjectResponse> {
        try {
            return await this.handler.execute(dto);
        } catch (error) {
            if (error instanceof Error) {
                if (error.message.includes('already exists')) {
                    throw new ConflictException(error.message);
                }
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }
}
