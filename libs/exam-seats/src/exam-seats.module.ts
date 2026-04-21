import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { PrismaExamSeatRepository } from './infrastructure/prisma-exam-seat.repository';

@Module({
    imports: [PrismaModule],
    providers: [
        {
            provide: 'EXAM_SEAT_REPOSITORY',
            useClass: PrismaExamSeatRepository,
        },
    ],
    exports: ['EXAM_SEAT_REPOSITORY'],
})
export class ExamSeatsModule { }
