import { Controller, Patch, Param, Body, UseGuards, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../../../common/guards';
import { Roles } from '../../../../common/decorators';
import { RoleType } from '@app/users';
import { SwapSeatsHandler } from './swap-seats.handler';
import { PrismaService } from '@app/prisma';
import { BadRequestException } from '@nestjs/common';
import { IsNotEmpty, IsString } from 'class-validator';

class SwapSeatsDto {
    @ApiProperty({ description: 'ID of the target seat to swap with' })
    @IsNotEmpty()
    @IsString()
    targetSeatId: string;
}

@ApiTags('Exam Seats')
@ApiBearerAuth('JWT-auth')
@Controller('exam-seats')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SwapSeatsEndpoint {
    constructor(
        private readonly handler: SwapSeatsHandler,
        private readonly prisma: PrismaService,
    ) { }

    @Patch(':id/swap')
    @Roles(RoleType.PROCTOR)
    @ApiOperation({ 
        summary: 'Swap students between two seats',
        description: 'Swap a student from one seat to another. Only works after layout is finalized and neither seat is locked.'
    })
    async swapSeats(
        @Param('id') sourceSeatId: string,
        @Body() dto: SwapSeatsDto,
    ) {
        // Get exam session from source seat
        const sourceSeat = await this.prisma.examSeat.findUnique({
            where: { id: sourceSeatId },
            select: { examSessionId: true }
        });

        if (!sourceSeat) {
            throw new BadRequestException('Source seat not found');
        }

        return this.handler.handle(sourceSeatId, dto.targetSeatId, sourceSeat.examSessionId);
    }
}

