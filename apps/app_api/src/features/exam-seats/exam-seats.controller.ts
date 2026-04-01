import { Controller, Get, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { ChangeExamSeatStatusHandler } from './use-cases/change-seat-status/change-seat-status.handler';
import { ChangeExamSeatStatusDto } from './use-cases/change-seat-status/change-seat-status.dto';
import { GetAllExamSeatsHandler } from './use-cases/get-all-exam-seats/get-all-exam-seats.handler';
import { GetExamSeatsBySessionHandler } from './use-cases/get-exam-seats-by-session/get-exam-seats-by-session.handler';
import { GetExamSeatsBySessionDto } from './use-cases/get-exam-seats-by-session/get-exam-seats-by-session.dto';
import { ExamSeatResponse } from './shared/exam-seat.response';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';

@ApiTags('Exam Seats')
@ApiBearerAuth('JWT-auth')
@Controller('exam-seats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExamSeatsController {
    constructor(
        private readonly changeExamSeatStatusHandler: ChangeExamSeatStatusHandler,
        private readonly getAllExamSeatsHandler: GetAllExamSeatsHandler,
        private readonly getExamSeatsBySessionHandler: GetExamSeatsBySessionHandler,
    ) { }

    @Get()
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER, RoleType.PROCTOR)
    async getAllSeats() {
        return this.getAllExamSeatsHandler.execute();
    }

    @Get('session/:sessionId')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER, RoleType.PROCTOR)
    async getSeatsBySession(
        @Param('sessionId') sessionId: string,
        @Query('status') status?: 'Available' | 'Locked' | 'Assigned' | 'Present' | 'Absent',
    ) {
        const dto: GetExamSeatsBySessionDto = { sessionId, status };
        return this.getExamSeatsBySessionHandler.execute(dto);
    }

    @Patch(':id/status')
    @Roles(RoleType.ADMIN, RoleType.EXAM_OFFICER, RoleType.PROCTOR)
    async changeStatus(
        @Param('id') id: string,
        @Body() body: Omit<ChangeExamSeatStatusDto, 'id'>,
        @Request() req: any,
    ): Promise<ExamSeatResponse> {
        const userRole = req.user?.role || 'GUEST';
        const dto: ChangeExamSeatStatusDto = {
            id,
            status: body.status,
        };
        return this.changeExamSeatStatusHandler.execute(dto, userRole);
    }
}
