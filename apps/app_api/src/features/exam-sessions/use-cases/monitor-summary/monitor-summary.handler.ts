import { Inject, Injectable, Logger } from '@nestjs/common';
import { IExamSessionRepository, EXAM_SESSION_REPOSITORY, SubjectMonitorSummary } from '@app/exam-sessions';
import { MonitorSummaryQueryDto } from './monitor-summary.dto';

@Injectable()
export class MonitorSummaryHandler {
    private readonly logger = new Logger(MonitorSummaryHandler.name);

    constructor(
        @Inject(EXAM_SESSION_REPOSITORY)
        private readonly repository: IExamSessionRepository,
    ) { }

    async execute(query: MonitorSummaryQueryDto): Promise<SubjectMonitorSummary[]> {
        this.logger.log(`[DEBUG] monitor-summary query: ${JSON.stringify(query)}`);
        
        // Fix: Nếu frontend gửi chuỗi rỗng, hãy coi như undefined để bỏ qua bộ lọc này
        const campus = query.campus || undefined;
        const semesterId = query.semesterId || undefined;

        return this.repository.getMonitorSummary({
            campus: campus,
            semesterId: semesterId,
            date: query.date ? new Date(query.date) : undefined,
        });
    }
}
