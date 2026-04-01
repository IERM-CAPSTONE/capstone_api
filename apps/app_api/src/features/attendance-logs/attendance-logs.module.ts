import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/prisma';
import { attendanceLogEndpoints, attendanceLogHandlers } from './use-cases';

@Module({
    imports: [PrismaModule],
    controllers: [...attendanceLogEndpoints],
    providers: [...attendanceLogHandlers],
})
export class AttendanceLogsModule { }
