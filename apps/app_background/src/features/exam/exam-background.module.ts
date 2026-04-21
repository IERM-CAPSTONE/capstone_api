import { Module } from '@nestjs/common';
import { UsersCoreModule } from '@app/users';
import { ExamRoomsCoreModule } from '@app/exam-rooms';
import { ExamSessionsCoreModule } from '@app/exam-sessions';
import { ExamSeatsModule } from '@app/exam-seats';
import { ExamImportProcessor } from './processors/exam-import.processor';
import { AutoGenerateScheduleProcessor } from './processors/auto-generate-schedule.processor';
import { AttendanceSnapshotProcessor } from './processors/attendance-snapshot.processor';
import { CloudinaryService } from '../../../../app_api/src/common/cloudinary/cloudinary.service';

@Module({
    imports: [
        UsersCoreModule,
        ExamRoomsCoreModule,
        ExamSessionsCoreModule,
        ExamSeatsModule,
    ],
    controllers: [
        ExamImportProcessor,
        AutoGenerateScheduleProcessor,
        AttendanceSnapshotProcessor,
    ],
    providers: [CloudinaryService],
})
export class ExamBackgroundModule { }
