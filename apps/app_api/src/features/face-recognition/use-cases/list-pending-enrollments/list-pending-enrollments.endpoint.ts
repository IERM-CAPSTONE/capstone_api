import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { GetUser, Roles } from '../../../../common/decorators';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { ListPendingEnrollmentsHandler } from './list-pending-enrollments.handler';

@ApiTags('Face Recognition')
@ApiBearerAuth()
@Controller('face-recognition/enrollment')
export class ListPendingEnrollmentsEndpoint {
  constructor(private readonly handler: ListPendingEnrollmentsHandler) {}

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER, RoleType.HALL_INVIGILATOR)
  @ApiOperation({ summary: 'List pending supervised face enrollments' })
  async execute(@GetUser() user: any) {
    return this.handler.execute(user);
  }
}
