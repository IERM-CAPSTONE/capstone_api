import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { RoleType } from '@app/users';
import { ImportExamCodeDto } from './import-exam-code.dto';
import { ImportExamCodeHandler } from './import-exam-code.handler';

@ApiTags('Exam Sessions')
@Controller('exam-sessions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ImportExamCodeEndpoint {
    constructor(private readonly handler: ImportExamCodeHandler) { }

    @Post('import-codes')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Import exam codes and open codes for sessions' })
    @ApiResponse({ status: 202, description: 'Import job accepted' })
    async import(@Body() dto: ImportExamCodeDto) {
        return this.handler.handle(dto);
    }
}
