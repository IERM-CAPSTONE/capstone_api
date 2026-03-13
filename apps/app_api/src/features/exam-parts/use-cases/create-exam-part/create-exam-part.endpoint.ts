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
import { ExamPartResponse } from '../../shared/exam-part.response';
import { CreateExamPartDto } from './create-exam-part.dto';
import { CreateExamPartHandler } from './create-exam-part.handler';

@ApiTags('ExamParts')
@ApiBearerAuth('JWT-auth')
@Controller('exam-parts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CreateExamPartEndpoint {
    constructor(private readonly handler: CreateExamPartHandler) { }

    @Post()
    @Roles(RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Create a new exam type' })
    @ApiBody({ type: CreateExamPartDto })
    @ApiResponse({ status: 201, description: 'Exam type created successfully', type: ExamPartResponse })
    @ApiResponse({ status: 400, description: 'Bad request' })
    @ApiResponse({ status: 409, description: 'Exam type already exists' })
    async handle(@Body() dto: CreateExamPartDto): Promise<ExamPartResponse> {
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
