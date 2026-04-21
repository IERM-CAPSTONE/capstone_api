import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@app/prisma';

type TicketStatsBucket = {
    name: string;
    count: number;
};

type SemesterBucket = {
    semesterId: string;
    code: string;
    name: string;
    count: number;
};

@Injectable()
export class GetTicketStatsHandler {
    constructor(private readonly prisma: PrismaService) { }

    async execute(input: { semesterId: string; week?: number }) {
        const semester = await (this.prisma as any).semester.findUnique({
            where: { id: input.semesterId },
            select: {
                id: true,
                code: true,
                name: true,
                startDate: true,
                endDate: true,
            },
        });

        if (!semester) {
            throw new NotFoundException(`Semester ${input.semesterId} not found`);
        }

        const range = this.resolveRange(semester.startDate, semester.endDate, input.week);

        const tickets = await (this.prisma as any).issueTicket.findMany({
            where: {
                createdAt: {
                    gte: range.start,
                    lte: range.end,
                },
                OR: [
                    { session: { is: { semesterId: semester.id } } },
                    { sessionId: null },
                ],
            },
            select: {
                id: true,
                issueType: true,
                issueName: true,
                createdAt: true,
                sessionId: true,
                session: {
                    select: {
                        subjectCode: true,
                        semesterId: true,
                    },
                },
                activityHistories: {
                    select: {
                        activityType: true,
                        createdAt: true,
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
        });

        const byIssueType = this.toBuckets(
            tickets.map((ticket: any) => ticket.issueType?.trim() || 'Unknown'),
        );
        const byIssueName = this.toBuckets(
            tickets.map((ticket: any) => ticket.issueName?.trim() || 'Untitled'),
        );
        const topSubjects = this.toBuckets(
            tickets
                .map((ticket: any) => ticket.session?.subjectCode?.trim())
                .filter((value: string | undefined): value is string => Boolean(value)),
        ).slice(0, 10);

        const startDurations = tickets
            .map((ticket: any) => this.findDurationMinutes(ticket.createdAt, ticket.activityHistories, 'TICKET_STARTED'))
            .filter((value: number | null): value is number => value !== null);

        const resolveDurations = tickets
            .map((ticket: any) => this.findDurationMinutes(ticket.createdAt, ticket.activityHistories, 'TICKET_RESOLVED'))
            .filter((value: number | null): value is number => value !== null);

        const bySemester = await this.getSemesterBuckets();

        return {
            filters: {
                semesterId: semester.id,
                semesterCode: semester.code,
                semesterName: semester.name ?? semester.code,
                week: input.week ?? null,
                totalWeeks: range.totalWeeks,
                rangeStart: range.start.toISOString(),
                rangeEnd: range.end.toISOString(),
            },
            summary: {
                totalTickets: tickets.length,
                avgTimeToStartMinutes: this.average(startDurations),
                avgTimeToResolveMinutes: this.average(resolveDurations),
                startedSampleSize: startDurations.length,
                resolvedSampleSize: resolveDurations.length,
            },
            byIssueType,
            byIssueName,
            topSubjects,
            bySemester,
        };
    }

    private resolveRange(startDate: Date, endDate: Date, week?: number) {
        const semesterStart = new Date(startDate);
        semesterStart.setHours(0, 0, 0, 0);

        const semesterEnd = new Date(endDate);
        semesterEnd.setHours(23, 59, 59, 999);

        const totalWeeks = Math.max(
            1,
            Math.ceil((semesterEnd.getTime() - semesterStart.getTime() + 1) / (7 * 24 * 60 * 60 * 1000)),
        );

        if (!week) {
            return { start: semesterStart, end: semesterEnd, totalWeeks };
        }

        if (week > totalWeeks) {
            throw new BadRequestException(`Week ${week} is out of range for semester ${totalWeeks}`);
        }

        const start = new Date(semesterStart);
        start.setDate(start.getDate() + (week - 1) * 7);

        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);

        return {
            start,
            end: end > semesterEnd ? semesterEnd : end,
            totalWeeks,
        };
    }

    private toBuckets(values: string[]): TicketStatsBucket[] {
        const counts = values.reduce((acc, value) => {
            acc[value] = (acc[value] ?? 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
    }

    private findDurationMinutes(createdAt: Date, histories: Array<{ activityType: string; createdAt: Date }>, targetType: string): number | null {
        const history = histories.find((item) => item.activityType === targetType);
        if (!history) {
            return null;
        }

        const diffMs = new Date(history.createdAt).getTime() - new Date(createdAt).getTime();
        if (diffMs < 0) {
            return null;
        }

        return Math.round(diffMs / 60000);
    }

    private average(values: number[]): number | null {
        if (!values.length) {
            return null;
        }

        const sum = values.reduce((total, value) => total + value, 0);
        return Math.round((sum / values.length) * 10) / 10;
    }

    private async getSemesterBuckets(): Promise<SemesterBucket[]> {
        const semesters = await (this.prisma as any).semester.findMany({
            select: {
                id: true,
                code: true,
                name: true,
                _count: {
                    select: {
                        examSessions: true,
                    },
                },
                examSessions: {
                    select: {
                        _count: {
                            select: {
                                tickets: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                startDate: 'asc',
            },
        });

        return semesters
            .map((semester: any) => ({
                semesterId: semester.id,
                code: semester.code,
                name: semester.name ?? semester.code,
                count: (semester.examSessions ?? []).reduce(
                    (total: number, session: any) => total + (session._count?.tickets ?? 0),
                    0,
                ),
            }));
    }
}
