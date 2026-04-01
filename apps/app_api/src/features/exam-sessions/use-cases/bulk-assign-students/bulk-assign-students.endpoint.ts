import { Controller, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { Roles } from '../../../../common/decorators';
import { RoleType } from '@app/users';
import { BulkAssignStudentsHandler } from './bulk-assign-students.handler';

@ApiTags('Exam Sessions')
@ApiBearerAuth('JWT-auth')
@Controller('exam-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BulkAssignStudentsEndpoint {
    constructor(private readonly handler: BulkAssignStudentsHandler) { }

    @Post(':id/bulk-assign-students')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({
        summary: 'Bulk assign students to available seats',
        description: 'Assign all unassigned students to available seats and lock layout editing for the session.',
    })
    async bulkAssignStudents(@Param('id') id: string) {
        return this.handler.handle(id);
    }
}
