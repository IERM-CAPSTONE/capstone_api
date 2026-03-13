import { Inject, Injectable } from '@nestjs/common';
import { IExamSessionRepository, EXAM_SESSION_REPOSITORY } from '@app/exam-sessions';
import { PrismaService } from '@app/prisma';

export interface AvailableDateResponse {
    date: string; // ISO date string (YYYY-MM-DD)
    count: number; // Number of exam sessions on this date
}

@Injectable()
export class GetAvailableDatesHandler {
    constructor(
        @Inject(EXAM_SESSION_REPOSITORY)
        private readonly examSessionRepository: IExamSessionRepository,
        private readonly prisma: PrismaService,
    ) { }

    /**
     * Calculate current semester based on date
     * SP: Jan-Apr (months 1-4)
     * SU: May-Aug (months 5-8)
     * FA: Sep-Dec (months 9-12)
     */
    private getCurrentSemester(): string {
        const now = new Date();
        const month = now.getMonth() + 1; // 1-12
        const year = now.getFullYear();
        const shortYear = year.toString().slice(-2); // "2026" -> "26"

        if (month >= 1 && month <= 4) return `SP${shortYear}`;
        if (month >= 5 && month <= 8) return `SU${shortYear}`;
        return `FA${shortYear}`;
    }

    async execute(semesterCode?: string): Promise<AvailableDateResponse[]> {
        // Use provided semester or auto-calculate current semester
        const semester = semesterCode || this.getCurrentSemester();

        // Find semesterId by code
        const semEntity = await this.prisma.semester.findFirst({
            where: { code: semester }
        });

        if (!semEntity) {
            return [];
        }

        // Get exam sessions filtered by semesterId
        const examSessions = await this.examSessionRepository.findMany({
            semesterId: semEntity.id,
        });

        // Group by date
        const dateMap = new Map<string, number>();

        for (const session of examSessions) {
            if (session.examTime?.openTime) {
                const dateStr = session.examTime.openTime.toISOString().split('T')[0]; // YYYY-MM-DD
                dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
            }
        }

        // Convert to array and sort
        const result: AvailableDateResponse[] = Array.from(dateMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return result;
    }
}
