import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBITMQ_CLIENTS, MESSAGE_PATTERNS } from '@app/queue';
import { AutoGenerateScheduleDto } from './auto-generate-schedule.dto';

@Injectable()
export class AutoGenerateScheduleHandler {
    private readonly logger = new Logger(AutoGenerateScheduleHandler.name);

    constructor(
        @Inject(RABBITMQ_CLIENTS.EXAM_SERVICE)
        private readonly examServiceClient: ClientProxy,
    ) { }

    async execute(dto: AutoGenerateScheduleDto) {
        this.logger.log(`Publishing auto-generate schedule job for semester ${dto.semesterId}, weeks ${dto.finalWeek}/${dto.retakeWeek}`);

        this.examServiceClient.emit(MESSAGE_PATTERNS.EXAM.AUTO_GENERATE_SCHEDULE, dto);

        return {
            success: true,
            message: 'Auto-generation job has been queued for processing',
            data: {
                semesterId: dto.semesterId,
                campus: dto.campus,
                finalWeek: dto.finalWeek,
                retakeWeek: dto.retakeWeek,
                roomsSelected: dto.roomIds.length
            }
        };
    }
}
