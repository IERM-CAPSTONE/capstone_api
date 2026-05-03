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

    private async resolveSeatId(sourceSeatRef: string) {
        const directSeat = await this.prisma.examSeat.findUnique({
            where: { id: sourceSeatRef },
            select: { id: true, examSessionId: true },
        });

        if (directSeat) {
            return directSeat;
        }

        const syntheticMatch = /^seat_(\d+)_(\d+)$/i.exec(sourceSeatRef.trim());
        if (!syntheticMatch) {
            return null;
        }

        const row = Number(syntheticMatch[1]) + 1;
        const col = Number(syntheticMatch[2]) + 1;

        return this.prisma.examSeat.findFirst({
            where: { row, col },
            select: { id: true, examSessionId: true },
        });
    }

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
        // Get exam session from source seat; also accept legacy synthetic seat refs.
        const sourceSeat = await this.resolveSeatId(sourceSeatId);
        const targetSeat = await this.resolveSeatId(dto.targetSeatId);

        if (!sourceSeat) {
            throw new BadRequestException('Source seat not found');
        }

        if (!targetSeat) {
            throw new BadRequestException('Target seat not found');
        }

        if (sourceSeat.examSessionId !== targetSeat.examSessionId) {
            throw new BadRequestException('Seats must belong to the same exam session');
        }

        return this.handler.handle(sourceSeat.id, targetSeat.id, sourceSeat.examSessionId);
    }
}

