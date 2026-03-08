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
        this.logger.log(`Publishing auto-generate job | PE:${dto.practicalWeek ?? '-'} FE:${dto.finalWeek} RE:${dto.retakeWeek} Coursera:${dto.courseraWeek ?? '-'} CourseraRe:${dto.courseraRetakeWeek ?? '-'}`);

        this.examServiceClient.emit(MESSAGE_PATTERNS.EXAM.AUTO_GENERATE_SCHEDULE, dto);

        return {
            success: true,
            message: 'Auto-generation job has been queued for processing',
            data: {
                semesterId: dto.semesterId,
                campus: dto.campus,
                finalWeek: dto.finalWeek,
                retakeWeek: dto.retakeWeek,
                practicalWeek: dto.practicalWeek,
                courseraWeek: dto.courseraWeek,
                courseraRetakeWeek: dto.courseraRetakeWeek,
                roomsSelected: dto.roomIds.length
            }
        };
    }
}
