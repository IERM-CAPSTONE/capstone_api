import { BadRequestException, Inject, Injectable } from '@nestjs/common';
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

    private async resolveSemesterId(semesterId?: string): Promise<string> {
        if (semesterId) {
            const semEntity = await this.prisma.semester.findUnique({
                where: { id: semesterId },
                select: { id: true },
            });

            if (!semEntity) {
                throw new BadRequestException(`Semester id ${semesterId} was not found.`);
            }

            return semEntity.id;
        }

        const now = new Date();
        const currentSemester = await this.prisma.semester.findFirst({
            where: {
                startDate: { lte: now },
                endDate: { gte: now },
            },
            orderBy: { startDate: 'desc' },
            select: { id: true },
        });

        if (currentSemester) {
            return currentSemester.id;
        }

        // Fallback 1: use the most recently created exam session that already has semesterId.
        const sessionWithSemester = await this.prisma.examSession.findFirst({
            where: {
                semesterId: { not: null },
            },
            orderBy: { createdAt: 'desc' },
            select: { semesterId: true },
        });

        if (sessionWithSemester?.semesterId) {
            return sessionWithSemester.semesterId;
        }

        // Fallback 2: use the latest semester by endDate if no exam session is linked yet.
        const latestSemester = await this.prisma.semester.findFirst({
            orderBy: { endDate: 'desc' },
            select: { id: true },
        });

        if (latestSemester) {
            return latestSemester.id;
        }

        throw new BadRequestException('No active semester found for current date.');
    }

    async execute(semesterId?: string): Promise<AvailableDateResponse[]> {
        const resolvedSemesterId = await this.resolveSemesterId(semesterId);

        // Get exam sessions filtered by semesterId
        const examSessions = await this.examSessionRepository.findMany({
            semesterId: resolvedSemesterId,
        });

        if (examSessions.length === 0) {
            throw new BadRequestException('No exam sessions found for selected semester.');
        }

        // Group by date
        const dateMap = new Map<string, number>();

        for (const session of examSessions) {
            const openDate = session.examTime?.openTime ?? null;
            const closeDate = session.examTime?.closeTime ?? null;
            const chosenDate = openDate ?? closeDate;

            if (!chosenDate) {
                continue;
            }

            const dateStr = chosenDate.toISOString().split('T')[0]; // YYYY-MM-DD
            dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
        }

        // Convert to array and sort
        const result: AvailableDateResponse[] = Array.from(dateMap.entries())
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date));

        if (result.length === 0) {
            throw new BadRequestException(
                'No scheduled exam dates are available for selected semester.',
            );
        }

        return result;
    }
}
