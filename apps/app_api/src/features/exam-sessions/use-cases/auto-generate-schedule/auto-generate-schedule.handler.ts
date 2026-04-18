import { Injectable, Inject, Logger, BadRequestException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { RABBITMQ_CLIENTS, MESSAGE_PATTERNS } from '@app/queue';
import { AutoGenerateScheduleDto } from './auto-generate-schedule.dto';

@Injectable()
export class AutoGenerateScheduleHandler {
    private readonly logger = new Logger(AutoGenerateScheduleHandler.name);

    private validateSelectedTypeWeek(dto: AutoGenerateScheduleDto): void {
        if (!dto.selectedType) {
            throw new BadRequestException('selectedType is required');
        }

        const requiredWeekByType: Record<NonNullable<AutoGenerateScheduleDto['selectedType']>, number | undefined> = {
            FE: dto.finalWeek,
            RE: dto.retakeWeek,
            PE: dto.practicalWeek,
            COURSERA_FE: dto.courseraWeek,
            COURSERA_RE: dto.courseraRetakeWeek,
        };

        const requiredWeek = requiredWeekByType[dto.selectedType];
        if (!requiredWeek || requiredWeek < 1) {
            const weekFieldByType: Record<NonNullable<AutoGenerateScheduleDto['selectedType']>, string> = {
                FE: 'finalWeek',
                RE: 'retakeWeek',
                PE: 'practicalWeek',
                COURSERA_FE: 'courseraWeek',
                COURSERA_RE: 'courseraRetakeWeek',
            };
            throw new BadRequestException(
                `${weekFieldByType[dto.selectedType]} is required and must be >= 1 when selectedType is ${dto.selectedType}`,
            );
        }
    }

    constructor(
        @Inject(RABBITMQ_CLIENTS.EXAM_SERVICE)
        private readonly examServiceClient: ClientProxy,
    ) { }

    async execute(dto: AutoGenerateScheduleDto) {
        this.validateSelectedTypeWeek(dto);

        this.logger.log(
            `Publishing auto-generate job | type:${dto.selectedType ?? '-'} PE:${dto.practicalWeek ?? '-'} FE:${dto.finalWeek ?? '-'} RE:${dto.retakeWeek ?? '-'} Coursera:${dto.courseraWeek ?? '-'} CourseraRe:${dto.courseraRetakeWeek ?? '-'}`
        );

        this.examServiceClient.emit(MESSAGE_PATTERNS.EXAM.AUTO_GENERATE_SCHEDULE, dto);

        return {
            success: true,
            message: 'Auto-generation job has been queued for processing',
            data: {
                semesterId: dto.semesterId,
                campus: dto.campus,
                selectedType: dto.selectedType,
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
