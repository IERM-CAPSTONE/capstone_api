import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { Campus } from '@prisma/client';

export interface SchedulingConstraints {
    semesterId: string;
    campus: Campus;
    selectedType?: 'FE' | 'RE' | 'PE' | 'COURSERA_FE' | 'COURSERA_RE';
    finalWeek?: number;
    retakeWeek?: number;
    practicalWeek?: number;
    courseraWeek?: number;       // Dedicated week for Coursera FE sessions
    courseraRetakeWeek?: number; // Dedicated week for Coursera RE sessions
    roomIds: string[];
    excelData: {
        studentCode: string;
        subjectCode: string;
        date?: string;
        slot?: number;
        scheduleId?: string;
        campus?: Campus;
    }[];
    busySlots?: Map<string, Set<string>>; // StudentCode -> Set of "day_slot" (relative to week)
    examDays?: number;
}

export interface ScheduledSession {
    weekNum: number;
    dayIndex: number; // 0 (Mon) to 6 (Sun)
    slotIndex: number;
    subjectCode: string;
    studentCodes: string[];
    roomId: string;
    campus: string;         // Resolved campus for this specific session room
    examPartIds: string[];  // All part IDs grouped into this session
    examType: 'PE' | 'FE' | 'TE' | 'RE';
    openTime: Date;
    closeTime: Date;
    duration: number;
    note?: string;
}

@Injectable()
export class SchedulingService {
    private readonly logger = new Logger(SchedulingService.name);

    private readonly START_HOUR = 7;
    private readonly START_MINUTE = 30;
    private readonly MIN_GAP_MINUTES = 40;
    private readonly FIXED_SLOT_START_OFFSETS_MINUTES = [0, 100, 200, 320, 420, 520];
    private readonly SLOT_OCCUPANCY_MINUTES = 90;
    private readonly MORNING_END_OFFSET_MINUTES = 260; // 11:50
    private readonly AFTERNOON_START_OFFSET_MINUTES = 320; // 12:50

    private subjectCache = new Map<string, any>();

    constructor(private readonly prisma: PrismaService) { }

    async generateSchedule(constraints: SchedulingConstraints): Promise<{ sessions: ScheduledSession[]; failedPools: any[] }> {
        const semester = await this.prisma.semester.findUnique({
            where: { id: constraints.semesterId }
        });
        if (!semester) throw new Error(`Semester ${constraints.semesterId} not found`);
        if (!constraints.selectedType) {
            throw new Error('selectedType is required. Automatic FE/RE/PE splitting is no longer supported.');
        }

        this.logger.log(`[CP_SOLVER] Starting High-Performance Constraint Solver for ${constraints.campus}...`);

        // 1. Prepare Data
        const subjectToCampusToStudents = new Map<string, Map<Campus, string[]>>();
        for (const item of constraints.excelData) {
            const subCode = item.subjectCode.toUpperCase();
            const studentCode = item.studentCode;
            const campus = item.campus || constraints.campus;
            if (!subjectToCampusToStudents.has(subCode)) subjectToCampusToStudents.set(subCode, new Map<Campus, string[]>());
            const campusMap = subjectToCampusToStudents.get(subCode);
            if (!campusMap.has(campus)) campusMap.set(campus, []);
            campusMap.get(campus).push(studentCode);
        }

        const csvSubjectCodes = Array.from(subjectToCampusToStudents.keys());
        const missingCodes = csvSubjectCodes.filter(code => !this.subjectCache.has(code));
        if (missingCodes.length > 0) {
            const fetched = await this.prisma.subject.findMany({
                where: { code: { in: missingCodes } },
                include: { parts: { include: { examPart: true } } }
            });
            fetched.forEach(s => this.subjectCache.set(s.code.toUpperCase(), s));
        }

        const failedPools: any[] = [];
        const subjectsInDb: any[] = [];

        for (const code of csvSubjectCodes) {
            const sub = this.subjectCache.get(code);
            if (!sub) {
                const affectedStudents = Array.from(subjectToCampusToStudents.get(code)?.values() || []).flat();
                failedPools.push({
                    subjectCode: code,
                    examType: 'ALL',
                    campus: Array.from(subjectToCampusToStudents.get(code)?.keys() || []).join(', '),
                    reason: 'Subject code not found in database',
                    note: 'Please import or check subject code',
                    _failStudents: affectedStudents,
                });
                continue;
            }
            subjectsInDb.push(sub);
        }

        const allRoomsInDb = await this.prisma.examRoom.findMany({ where: { id: { in: constraints.roomIds } } });
        const campusRooms = new Map<Campus, string[]>();
        const roomCapacityMap = new Map<string, number>();
        const campusCapacityMap = new Map<Campus, number>();
        allRoomsInDb.forEach(r => {
            const camp = r.campus as Campus;
            if (!campusRooms.has(camp)) campusRooms.set(camp, []);
            campusRooms.get(camp).push(r.id);
            const cap = (r as any).total_seats || ((r as any).max_rows * (r as any).max_columns) || 30;
            roomCapacityMap.set(r.id, cap);
            if (!campusCapacityMap.has(camp)) campusCapacityMap.set(camp, cap);
        });

        // 2. Identify All Session Goals (Nodes in the Constraint Graph)
        const allPools: any[] = [];
        for (const sub of subjectsInDb) {
            const campusToStudents = subjectToCampusToStudents.get(sub.code.toUpperCase());
            if (!campusToStudents) continue;

            const peParts = sub.parts.filter(p => {
                const code = p.examPart.code.toUpperCase();
                const name = p.examPart.name.toUpperCase();
                return code === 'PE' || code === 'P' || code.includes('PRACTICAL') || name.includes('THỰC HÀNH');
            });
            const reParts = sub.parts.filter(p => p.examPart.code.toUpperCase().includes('RE'));
            const feParts = sub.parts.filter(p => !peParts.includes(p) && !reParts.includes(p));

            const buildSession = (type: string, parts: any[], week: number | undefined) => {
                if (!week || parts.length === 0) return null;
                const campusNeeds: Record<string, { studentCodes: string[], numRooms: number }> = {};
                campusToStudents.forEach((students, camp) => {
                    const capacity = campusCapacityMap.get(camp) || 30;
                    if (students.length > 0) {
                        campusNeeds[camp] = { studentCodes: this.shuffle(students), numRooms: Math.ceil(students.length / capacity) };
                    }
                });
                return {
                    subjectCode: sub.code,
                    campusNeeds,
                    duration: parts.reduce((acc, p) => acc + (p.duration || 60), 0),
                    examPartIds: parts.map(p => p.examPartId),
                    examType: type as any,
                    weekNum: week,
                    note: parts.map(p => p.examPart.code.toUpperCase()).join(', ')
                };
            };

            let sessionPool: any = null;

            switch (constraints.selectedType) {
                case 'PE':
                    sessionPool = buildSession('PE', peParts, constraints.practicalWeek);
                    break;
                case 'FE':
                    if (!sub.isCoursera) {
                        sessionPool = buildSession('FE', feParts, constraints.finalWeek);
                    }
                    break;
                case 'RE':
                    if (!sub.isCoursera) {
                        sessionPool = buildSession('RE', reParts.length > 0 ? reParts : feParts, constraints.retakeWeek);
                    }
                    break;
                case 'COURSERA_FE':
                    if (sub.isCoursera) {
                        sessionPool = buildSession('FE', feParts, constraints.courseraWeek);
                    }
                    break;
                case 'COURSERA_RE':
                    if (sub.isCoursera) {
                        sessionPool = buildSession('RE', reParts.length > 0 ? reParts : feParts, constraints.courseraRetakeWeek);
                    }
                    break;
            }

            if (sessionPool) {
                allPools.push(sessionPool);
            } else {
                const affectedStudents = Array.from(campusToStudents.values()).flat();
                failedPools.push({
                    subjectCode: sub.code,
                    examType: constraints.selectedType,
                    campus: Array.from(campusToStudents.keys()).join(', '),
                    reason: 'No matching exam parts or week configured for selected type',
                    note: 'Check selected type and subject exam parts',
                    _failStudents: affectedStudents,
                });
            }
        }

        // 3. MASTER ASSIGNMENT (GREEDY HEURISTIC - REPLACED LP SOLVER FOR MASSIVE SCALES)
        const daysToTry = Array.from({ length: constraints.examDays || 6 }, (_, i) => i);
        this.logger.log(`[GREEDY_HEURISTIC] Building Round-Robin Distribution for ${allPools.length} pools over ${daysToTry.length} days...`);

        const dayAssignments = new Map<number, any[]>();
        daysToTry.forEach(d => dayAssignments.set(d, []));
        const assignedPoolIndices = new Set<number>();

        // Sort pools by the number of rooms they need (largest pools first to fit them easier)
        const sortedPools = allPools.map((pool, index) => ({ pool, index })).sort((a, b) => {
            const sumA = Object.keys(a.pool.campusNeeds).reduce<number>((acc, camp: any) => acc + (a.pool.campusNeeds[camp].numRooms || 0), 0);
            const sumB = Object.keys(b.pool.campusNeeds).reduce<number>((acc, camp: any) => acc + (b.pool.campusNeeds[camp].numRooms || 0), 0);
            return sumB - sumA;
        });

        // Round-robin assignment based on daily loads
        let dayCounter = 0;
        for (const item of sortedPools) {
            const targetDay = daysToTry[dayCounter];
            dayAssignments.get(targetDay).push(item.pool);
            assignedPoolIndices.add(item.index);
            dayCounter = (dayCounter + 1) % daysToTry.length;
        }

        allPools.forEach((pool, idx) => {
            if (!assignedPoolIndices.has(idx)) {
                failedPools.push({
                    subjectCode: pool.subjectCode,
                    examType: pool.examType,
                    campus: Object.keys(pool.campusNeeds || {}).join(', '),
                    reason: 'Failed to assign day in greedy master plan',
                    note: pool.note,
                    _failStudents: pool._failStudents || [],
                    _failRooms: pool._failRooms,
                });
            }
        });

        this.logger.log(`[HYBRID_SOLVER] Starting session assignment across ${dayAssignments.size} days...`);

        const weekStates = new Map<number, any>();
        const getOrCreateState = (week: number) => {
            if (!weekStates.has(week)) {
                weekStates.set(week, {
                    roomTimelines: new Map(),
                    studentIntervals: new Map(),
                    studentDayCounts: new Map(),
                    slotLoad: new Map() // campus_day_slot -> count
                });
            }
            return weekStates.get(week);
        };

        const finalSchedule: ScheduledSession[] = [];
        const sortedDays = Array.from(dayAssignments.keys()).sort((a, b) => a - b);

        for (const day of sortedDays) {
            const poolsOnDay = dayAssignments.get(day);
            this.logger.log(`[HYBRID_SOLVER] Day ${day}: Scheduling ${poolsOnDay.length} subject pools...`);
            poolsOnDay.sort((a, b) => b.duration - a.duration);

            for (const pool of poolsOnDay) {
                const state = getOrCreateState(pool.weekNum);
                const results = this.assignSyncedSpecificDay(pool, campusRooms, semester.startDate, pool.weekNum, day, state, roomCapacityMap, constraints.busySlots, constraints.examDays || 6);
                if (results.sessions.length > 0) {
                    finalSchedule.push(...results.sessions);
                } else {
                    this.logger.warn(`[HYBRID_SOLVER] Day ${day}: Finding optimal slot for ${pool.subjectCode}... Switching to Multi-Day Search.`);
                    const fallback = this.assignSynced([pool], campusRooms, semester.startDate, pool.weekNum, state, true, roomCapacityMap, constraints.busySlots, undefined, constraints.examDays || 6);
                    if (fallback.sessions.length > 0) {
                        finalSchedule.push(...fallback.sessions);
                    } else {
                        failedPools.push({
                            subjectCode: pool.subjectCode,
                            examType: pool.examType,
                            campus: Object.keys(pool.campusNeeds || {}).join(', '),
                            reason: pool._failReason || 'Conflict with rooms or student busy slots',
                            note: pool.note,
                            _failStudents: pool._failStudents || [],
                            _failRooms: pool._failRooms,
                        });
                    }
                }
            }
        }

        // Compute summary statistics
        const totalFailedStudents = new Set<string>();
        failedPools.forEach(f => (f._failStudents || []).forEach((s: string) => totalFailedStudents.add(s)));
        this.logger.log(`[HYBRID_SOLVER] Optimization complete. Successfully scheduled ${finalSchedule.length} sessions.`);
        this.logger.log(`[STATS] ❌ Failed pools: ${failedPools.length} subjects | Affected students: ${totalFailedStudents.size}`);
        if (failedPools.length > 0) {
            const byReason = failedPools.reduce<Record<string, number>>((acc, f) => {
                acc[f.reason] = (acc[f.reason] || 0) + 1;
                return acc;
            }, {});
            Object.entries(byReason).forEach(([reason, count]) =>
                this.logger.warn(`[STATS]   - ${reason}: ${count} subject(s)`)
            );
        }
        return { sessions: finalSchedule, failedPools };
    }

    private assignSyncedSpecificDay(pool: any, campusRooms: Map<Campus, string[]>, start: Date, week: number, day: number, state: any, roomCaps: any, busy: any, examDays: number): { sessions: ScheduledSession[] } {
        // Reuse logic but lock to one day
        return this.assignSynced([pool], campusRooms, start, week, state, false, roomCaps, busy, [day], examDays);
    }


    private assignSynced(
        sessions: any[],
        campusRooms: Map<Campus, string[]>,
        semStartDate: Date,
        weekNum: number,
        state: {
            roomTimelines: Map<string, Map<number, number>>,
            studentIntervals: Map<string, Map<number, { start: number, end: number }[]>>,
            studentDayCounts: Map<string, Map<number, number>>,
            slotLoad: Map<string, number>
        },
        allowSpill: boolean,
        roomCapacityMap?: Map<string, number>,
        busySlots?: Map<string, Set<string>>,
        overrideDaySequence?: number[],
        examDays: number = 6
    ): { sessions: ScheduledSession[] } {
        if (sessions.length === 0) return { sessions: [] };

        const results: ScheduledSession[] = [];

        // Sort: Longest duration first
        sessions.sort((a, b) => {
            const sumA = Object.values(a.campusNeeds).reduce<number>((acc, val: any) => acc + (Number(val.numRooms) || 0), 0);
            const sumB = Object.values(b.campusNeeds).reduce<number>((acc, val: any) => acc + (Number(val.numRooms) || 0), 0);
            if (Number(b.duration) !== Number(a.duration)) return (Number(b.duration) || 0) - (Number(a.duration) || 0);
            return sumB - sumA;
        });

        const isPE = sessions[0].examType === 'PE';
        let daySequence = overrideDaySequence;
        if (!daySequence) {
            daySequence = isPE ? [5, 6, 0, 1, 2, 3, 4] : Array.from({ length: examDays }, (_, i) => i);
        }

        for (const session of sessions) {
            let scheduledForSubject = false;

            for (const day of daySequence) {
                if (scheduledForSubject) break;

                const dayStart = this.getStartOfDayTime(semStartDate, weekNum, day).getTime();
                const SLOT_DURATION_MS = this.SLOT_OCCUPANCY_MINUTES * 60000;
                const slotIndices = Array.from({ length: this.FIXED_SLOT_START_OFFSETS_MINUTES.length }, (_, i) => i);
                const actualDurationMs = (Number(session.duration) || 60) * 60000;
                const requiredSlotCount = this.getRequiredSlotCount(Number(session.duration) || 60);
                const sessionOccupiedMs = requiredSlotCount * SLOT_DURATION_MS;
                const dayEnd = this.getDayEndTimestamp(dayStart);

                // BALANCING LOGIC: Sort slots by current load across all involved campuses
                slotIndices.sort((a, b) => {
                    let loadA = 0;
                    let loadB = 0;
                    for (const camp of Object.keys(session.campusNeeds)) {
                        loadA += state.slotLoad.get(`${camp}_${day}_${a}`) || 0;
                        loadB += state.slotLoad.get(`${camp}_${day}_${b}`) || 0;
                    }
                    if (loadA !== loadB) return loadA - loadB;
                    return a - b; // Tie-break: earlier slots first
                });

                for (const slotIndex of slotIndices) {
                    const currentAttemptStart = this.getSlotStartTimestamp(dayStart, slotIndex);

                    const dayResults: ScheduledSession[] = [];
                    let attemptIsPossible = true;

                    // 1. PHASE 1: Identify needed rooms
                    const roomsToUse: { camp: Campus, roomId: string, nextAvailable: number }[] = [];
                    for (const campStr of Object.keys(session.campusNeeds)) {
                        const camp = campStr as Campus;
                        const need = session.campusNeeds[camp];
                        const availableRoomIds = campusRooms.get(camp) || [];

                        if (availableRoomIds.length < need.numRooms) {
                            attemptIsPossible = false;
                            session._failReason = `Campus ${camp} lacks rooms. Needs ${need.numRooms}, only ${availableRoomIds.length} available.`;
                            session._failRooms = {
                                campus: camp,
                                needed: need.numRooms,
                                available: availableRoomIds.length,
                                roomIds: availableRoomIds
                            };
                            break;
                        }

                        const roomsWithTimes = availableRoomIds.map(rid => {
                            if (!state.roomTimelines.has(rid)) state.roomTimelines.set(rid, new Map());
                            const dayTimelines = state.roomTimelines.get(rid);
                            if (!dayTimelines.has(day)) dayTimelines.set(day, dayStart);
                            return { camp, roomId: rid, next: dayTimelines.get(day) };
                        });

                        roomsWithTimes.sort((a, b) => a.next - b.next);
                        roomsToUse.push(...roomsWithTimes.slice(0, need.numRooms).map(r => ({
                            camp: r.camp,
                            roomId: r.roomId,
                            nextAvailable: r.next
                        })));
                    }

                    if (!attemptIsPossible || roomsToUse.length === 0) continue;

                    // 2. Adjust attempt start to respect room availability
                    const requestedStart = isPE
                        ? currentAttemptStart
                        : Math.max(currentAttemptStart, ...roomsToUse.map(r => r.nextAvailable));
                    const snappedAttempt = this.snapToAllowedSlot(dayStart, requestedStart);
                    if (!snappedAttempt) continue;

                    const earliestPossibleStart = snappedAttempt.start;
                    const effectiveSlotIndex = snappedAttempt.slotIndex;

                    if (earliestPossibleStart + sessionOccupiedMs > dayEnd) continue;

                    // 3. PHASE 3: Iteratively schedule
                    let subjectSequencePointer = earliestPossibleStart;
                    for (const roomInfo of roomsToUse) {
                        const requestedRoomStart = isPE
                            ? Math.max(roomInfo.nextAvailable, subjectSequencePointer)
                            : earliestPossibleStart;
                        const snappedRoomStart = this.snapToAllowedSlot(dayStart, requestedRoomStart);
                        if (!snappedRoomStart) {
                            attemptIsPossible = false;
                            break;
                        }

                        const proposedStart = snappedRoomStart.start;
                        const proposedEnd = proposedStart + actualDurationMs;
                        const occupiedUntil = proposedStart + sessionOccupiedMs;
                        const roomCap = roomCapacityMap?.get(roomInfo.roomId) || 30;
                        const need = session.campusNeeds[roomInfo.camp];

                        if (this.crossesLunchBreak(dayStart, proposedStart, proposedEnd)) {
                            attemptIsPossible = false;
                            session._failReason = 'Exam time crosses the lunch break (11:50-12:50).';
                            break;
                        }

                        if (
                            (Number(session.duration) || 60) >= 180 &&
                            !this.isWithinSingleHalfDay(dayStart, proposedStart, proposedEnd)
                        ) {
                            attemptIsPossible = false;
                            session._failReason = '180-minute exams must stay within a single morning or afternoon session.';
                            break;
                        }

                        const roomIdx = roomsToUse.filter(r => r.camp === roomInfo.camp).indexOf(roomInfo);
                        const roomStudents = need.studentCodes.slice(roomIdx * roomCap, (roomIdx + 1) * roomCap);

                        let studentConflict = false;
                        const conflictStudents: string[] = [];
                        for (const s of roomStudents) {
                            if ((state.studentDayCounts.get(s)?.get(day) || 0) >= 2) {
                                studentConflict = true;
                                conflictStudents.push(s);
                                session._failReason = `Some students exceeded the 2 exams/day limit.`;
                                continue;
                            }
                            let hasTimeConflict = false;
                            const intervals = state.studentIntervals.get(s)?.get(day) || [];
                            for (const existing of intervals) {
                                if (proposedStart < existing.end && occupiedUntil > existing.start) {
                                    hasTimeConflict = true;
                                    break;
                                }
                            }
                            if (hasTimeConflict) {
                                studentConflict = true;
                                conflictStudents.push(s);
                                session._failReason = `Time overlap with another exam for some students.`;
                                continue;
                            }

                            if (busySlots?.has(s)) {
                                const searchDay = day === 7 ? 0 : day;
                                const busySets = busySlots.get(s);
                                for (let sl = 1; sl <= this.FIXED_SLOT_START_OFFSETS_MINUTES.length; sl++) {
                                    if (busySets.has(`${searchDay}_${sl}`)) {
                                        const bStart = this.getSlotStartTimestamp(dayStart, sl - 1);
                                        const bEnd = bStart + SLOT_DURATION_MS;
                                        if (proposedStart < bEnd && occupiedUntil > bStart) {
                                            studentConflict = true;
                                            conflictStudents.push(s);
                                            session._failReason = `Conflict with student's FAP daily timetable.`;
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                        if (conflictStudents.length > 0) {
                            session._failStudents = [...new Set([...(session._failStudents || []), ...conflictStudents])];
                        }

                        if (studentConflict) {
                            attemptIsPossible = false;
                            break;
                        }

                        dayResults.push({
                            weekNum,
                            dayIndex: day,
                            slotIndex: effectiveSlotIndex,
                            subjectCode: session.subjectCode,
                            studentCodes: roomStudents,
                            roomId: roomInfo.roomId,
                            campus: roomInfo.camp as string,
                            examPartIds: session.examPartIds,
                            examType: session.examType,
                            openTime: new Date(proposedStart),
                            closeTime: new Date(proposedEnd),
                            duration: session.duration,
                            note: session.note
                        });

                        if (isPE) subjectSequencePointer = occupiedUntil + this.MIN_GAP_MINUTES * 60000;
                    }

                    if (attemptIsPossible && dayResults.length === roomsToUse.length) {
                        for (const res of dayResults) {
                            const dayTimelines = state.roomTimelines.get(res.roomId);
                            const blockedUntil = res.openTime.getTime() + sessionOccupiedMs;
                            dayTimelines.set(day, blockedUntil);
                            for (const s of res.studentCodes) {
                                if (!state.studentIntervals.has(s)) state.studentIntervals.set(s, new Map());
                                if (!state.studentIntervals.get(s).has(day)) state.studentIntervals.get(s).set(day, []);
                                state.studentIntervals.get(s).get(day).push({
                                    start: res.openTime.getTime(),
                                    end: blockedUntil
                                });
                                if (!state.studentDayCounts.has(s)) state.studentDayCounts.set(s, new Map());
                                const counts = state.studentDayCounts.get(s);
                                counts.set(day, (counts.get(day) || 0) + 1);
                            }
                            // Update slot load for balancing
                            const loadKey = `${res.campus}_${day}_${res.slotIndex}`;
                            state.slotLoad.set(loadKey, (state.slotLoad.get(loadKey) || 0) + 1);
                        }
                        results.push(...dayResults);
                        scheduledForSubject = true;
                        break;
                    }
                }
            }
        }
        return { sessions: results };
    }
    private getStartOfDayTime(semStart: Date, weekNum: number, dayOffset: number): Date {
        const date = new Date(semStart);
        // Ensure calculations run relative to UTC to prevent local timezone shifts causing 00:30 displays
        const currentDay = date.getUTCDay();
        const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;

        date.setUTCDate(date.getUTCDate() - diffToMonday + (weekNum - 1) * 7 + dayOffset);
        date.setUTCHours(this.START_HOUR, this.START_MINUTE, 0, 0);

        return date;
    }

    private getRequiredSlotCount(durationMinutes: number): number {
        if (durationMinutes <= 60) return 1;
        if (durationMinutes <= 90) return 2; // Assumption for the unresolved 90-minute case
        if (durationMinutes <= 180) return 3;
        return Math.max(1, Math.ceil(durationMinutes / 60));
    }

    private getSlotStartTimestamp(dayStart: number, slotIndex: number): number {
        return dayStart + (this.FIXED_SLOT_START_OFFSETS_MINUTES[slotIndex] || 0) * 60000;
    }

    private getDayEndTimestamp(dayStart: number): number {
        return this.getSlotStartTimestamp(dayStart, this.FIXED_SLOT_START_OFFSETS_MINUTES.length - 1)
            + this.SLOT_OCCUPANCY_MINUTES * 60000;
    }

    private getMorningEndTimestamp(dayStart: number): number {
        return dayStart + this.MORNING_END_OFFSET_MINUTES * 60000;
    }

    private getAfternoonStartTimestamp(dayStart: number): number {
        return dayStart + this.AFTERNOON_START_OFFSET_MINUTES * 60000;
    }

    private crossesLunchBreak(dayStart: number, start: number, end: number): boolean {
        const morningEnd = this.getMorningEndTimestamp(dayStart);
        const afternoonStart = this.getAfternoonStartTimestamp(dayStart);
        return start < afternoonStart && end > morningEnd;
    }

    private isWithinSingleHalfDay(dayStart: number, start: number, end: number): boolean {
        const morningEnd = this.getMorningEndTimestamp(dayStart);
        const afternoonStart = this.getAfternoonStartTimestamp(dayStart);
        return (start >= dayStart && end <= morningEnd) || start >= afternoonStart;
    }

    private snapToAllowedSlot(dayStart: number, minTimestamp: number): { slotIndex: number; start: number } | null {
        for (let i = 0; i < this.FIXED_SLOT_START_OFFSETS_MINUTES.length; i++) {
            const start = this.getSlotStartTimestamp(dayStart, i);
            if (start >= minTimestamp) {
                return { slotIndex: i, start };
            }
        }
        return null;
    }

    assignSeats(numStudents: number, maxRows: number, maxCols: number): { row: number; col: number }[] {
        const allSeats: { row: number; col: number }[] = [];
        for (let r = 1; r <= maxRows; r++) {
            for (let c = 1; c <= maxCols; c++) {
                allSeats.push({ row: r, col: c });
            }
        }
        if (numStudents >= allSeats.length) return this.shuffle(allSeats).slice(0, numStudents);
        const selectedSeats: { row: number; col: number }[] = [];
        const firstIndex = Math.floor(Math.random() * allSeats.length);
        selectedSeats.push(allSeats.splice(firstIndex, 1)[0]);
        while (selectedSeats.length < numStudents) {
            let maxMinDist = -1;
            let bestIndex = -1;
            for (let i = 0; i < allSeats.length; i++) {
                const seat = allSeats[i];
                let minDistToSelected = Infinity;
                for (const selected of selectedSeats) {
                    const dist = Math.abs(seat.row - selected.row) + Math.abs(seat.col - selected.col);
                    if (dist < minDistToSelected) minDistToSelected = dist;
                }
                if (minDistToSelected > maxMinDist) {
                    maxMinDist = minDistToSelected;
                    bestIndex = i;
                } else if (minDistToSelected === maxMinDist && Math.random() > 0.5) {
                    bestIndex = i;
                }
            }
            if (bestIndex !== -1) selectedSeats.push(allSeats.splice(bestIndex, 1)[0]);
            else break;
        }
        return this.shuffle(selectedSeats);
    }

    private shuffle<T>(array: T[]): T[] {
        const result = [...array];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }
}
