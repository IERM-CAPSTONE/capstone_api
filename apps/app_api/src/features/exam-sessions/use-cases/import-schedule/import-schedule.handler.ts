import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBITMQ_CLIENTS, MESSAGE_PATTERNS, ImportScheduleJobData } from '@app/queue';
import { ImportScheduleDto } from './import-schedule.dto';

@Injectable()
export class ImportScheduleHandler {
    private readonly logger = new Logger(ImportScheduleHandler.name);

    constructor(
        @Inject(RABBITMQ_CLIENTS.EXAM_SERVICE)
        private readonly examServiceClient: ClientProxy,
    ) { }

    async handle(dto: ImportScheduleDto) {
        this.logger.log(`Publishing import schedule job to queue. Schedules: ${dto.schedules.length}, Students: ${dto.students.length}`);
        const defaultCampus = 'DN';

        const jobData: ImportScheduleJobData = {
            importType: dto.importType,
            schedules: dto.schedules.map((item) => ({
                ...item,
                campus: item.campus || defaultCampus,
            })),
            students: dto.students.map((item) => ({
                ...item,
                campus: item.campus || defaultCampus,
            })),
            batchId: dto.batchId,
            totalItems: dto.totalItems,
        };

        this.examServiceClient.emit(MESSAGE_PATTERNS.EXAM.IMPORT_SCHEDULE, jobData);

        return {
            success: true,
            message: 'Import schedule job has been queued for processing',
            data: {
                schedulesReceived: dto.schedules.length,
                studentsReceived: dto.students.length,
            }
        };
    }
}
