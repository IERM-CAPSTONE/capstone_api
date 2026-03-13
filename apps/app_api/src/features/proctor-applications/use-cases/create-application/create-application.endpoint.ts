import {
    Controller,
    Post,
    Body,
    BadRequestException,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles, GetUser } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { ProctorApplicationResponse } from '../../shared/proctor-application.response';
import { CreateProctorApplicationDto } from './create-application.dto';
import { CreateProctorApplicationHandler } from './create-application.handler';

@ApiTags('Proctor Applications')
@ApiBearerAuth('JWT-auth')
@Controller('proctor-applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CreateProctorApplicationEndpoint {
    constructor(private readonly handler: CreateProctorApplicationHandler) { }

    @Post()
    @Roles(RoleType.PROCTOR)
    @ApiOperation({ summary: 'Create a new proctor application (Proctor only)' })
    @ApiBody({ type: CreateProctorApplicationDto })
    @ApiResponse({ status: 201, description: 'Application created successfully', type: ProctorApplicationResponse })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async handle(
        @Body() dto: CreateProctorApplicationDto,
        @GetUser('userId') userId: string,
    ): Promise<ProctorApplicationResponse> {
        try {
            return await this.handler.execute(dto, userId);
        } catch (error) {
            if (error instanceof Error) {
                throw new BadRequestException(error.message);
            }
            throw error;
        }
    }
}
