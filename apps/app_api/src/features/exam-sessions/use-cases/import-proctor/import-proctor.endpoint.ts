import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../../../common/guards/roles.guard';
import { Roles } from '../../../../common/decorators/roles.decorator';
import { RoleType } from '@app/users';
import { ImportProctorDto } from './import-proctor.dto';
import { ImportProctorHandler } from './import-proctor.handler';

@ApiTags('Exam Sessions')
@Controller('exam-sessions')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class ImportProctorEndpoint {
    constructor(private readonly handler: ImportProctorHandler) { }

    @Post('import-proctor')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Import proctor assignments for exam sessions' })
    @ApiResponse({ status: 202, description: 'Import job accepted' })
    async import(@Body() dto: ImportProctorDto, @Req() req: any) {
        return this.handler.handle(dto, req.user?.userId);
    }
}
