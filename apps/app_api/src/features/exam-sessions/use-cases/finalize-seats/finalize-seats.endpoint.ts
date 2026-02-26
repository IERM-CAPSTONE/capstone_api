import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { Roles } from '../../../../common/decorators';
import { RoleType } from '@app/users';
import { FinalizeSeatAssignmentsHandler } from './finalize-seats.handler';

@ApiTags('Exam Sessions')
@ApiBearerAuth('JWT-auth')
@Controller('exam-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinalizeSeatAssignmentsEndpoint {
    constructor(private readonly handler: FinalizeSeatAssignmentsHandler) { }

    @Post(':id/finalize-seats')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ 
        summary: 'Finalize seat assignments for a session',
        description: 'Assigns imported students to available seats and locks layout editing'
    })
    async finalizeSeatAssignments(@Param('id') id: string) {
        return this.handler.handle(id);
    }
}
