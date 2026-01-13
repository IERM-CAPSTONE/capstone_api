import { Module } from '@nestjs/common';
import { UsersCoreModule } from '@app/users';
import { ExamRoomsCoreModule } from '@app/exam-rooms';
import { ExamSessionsCoreModule } from '@app/exam-sessions';
import { ExamImportProcessor } from './processors/exam-import.processor';

@Module({
    imports: [
        UsersCoreModule,
        ExamRoomsCoreModule,
        ExamSessionsCoreModule,
    ],
    controllers: [
        ExamImportProcessor,
    ],
    providers: [],
})
export class ExamBackgroundModule { }
