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
import { ExamTypeResponse } from '../../shared/exam-type.response';
import { CreateExamTypeDto } from './create-exam-type.dto';
import { CreateExamTypeHandler } from './create-exam-type.handler';

@ApiTags('ExamTypes')
@ApiBearerAuth('JWT-auth')
@Controller('exam-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CreateExamTypeEndpoint {
    constructor(private readonly handler: CreateExamTypeHandler) { }

    @Post()
    @Roles(RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Create a new exam type' })
    @ApiBody({ type: CreateExamTypeDto })
    @ApiResponse({ status: 201, description: 'Exam type created successfully', type: ExamTypeResponse })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 409, description: 'Exam type already exists' })
    async handle(@Body() dto: CreateExamTypeDto): Promise<ExamTypeResponse> {
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
