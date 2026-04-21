import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { RoleType } from '@app/users';
import { Roles } from '../../../../common/decorators';
import { RolesGuard, JwtAuthGuard } from '../../../../common/guards';
import { GetAvailableDatesHandler, AvailableDateResponse } from './get-available-dates.handler';

@ApiTags('Proctor Applications')
@ApiBearerAuth('JWT-auth')
@Controller('proctor-applications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GetAvailableDatesEndpoint {
    constructor(private readonly handler: GetAvailableDatesHandler) { }

    @Get('available-dates')
    @Roles(RoleType.PROCTOR, RoleType.ADMIN, RoleType.EXAM_OFFICER)
    @ApiOperation({ summary: 'Get available dates from exam sessions for application' })
    @ApiQuery({ name: 'semester', required: false, type: String, description: 'Filter by semester code' })
    @ApiResponse({ status: 200, description: 'Available dates retrieved', schema: {
        type: 'array',
        items: {
            type: 'object',
            properties: {
                date: { type: 'string', example: '2026-02-15' },
                count: { type: 'number', example: 5 },
            },
        },
    } })
    async handle(@Query('semester') semester?: string): Promise<AvailableDateResponse[]> {
        return this.handler.execute(semester);
    }
}
