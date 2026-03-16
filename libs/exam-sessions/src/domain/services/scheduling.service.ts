import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { Campus } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const solver = require('javascript-lp-solver');

export interface SchedulingConstraints {
    semesterId: string;
    campus: Campus;
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
    private readonly MINUTES_PER_DAY = 10 * 60;

    private subjectCache = new Map<string, any>();

    constructor(private readonly prisma: PrismaService) { }

    async generateSchedule(constraints: SchedulingConstraints): Promise<ScheduledSession[]> {
        const semester = await this.prisma.semester.findUnique({
            where: { id: constraints.semesterId }
        });
        if (!semester) throw new Error(`Semester ${constraints.semesterId} not found`);

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

        const subjectsInDb = csvSubjectCodes.map(code => this.subjectCache.get(code)).filter(Boolean);
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
                    isMajor: sub.isMajor || sub.isCoursera,
                    weekNum: week,
                    note: parts.map(p => p.examPart.code.toUpperCase()).join(', ')
                };
            };

            const pe = buildSession('PE', peParts, constraints.practicalWeek); if (pe) allPools.push(pe);
            if (sub.isCoursera) {
                const cf = buildSession('FE', feParts, constraints.courseraWeek ?? constraints.finalWeek); if (cf) allPools.push(cf);
                const cr = buildSession('RE', reParts.length > 0 ? reParts : feParts, constraints.courseraRetakeWeek ?? constraints.retakeWeek); if (cr) allPools.push(cr);
            } else {
                const f = buildSession('FE', feParts, constraints.finalWeek); if (f) allPools.push(f);
                const r = buildSession('RE', reParts.length > 0 ? reParts : feParts, constraints.retakeWeek); if (r) allPools.push(r);
            }
        }

        // 3. MASTER ASSIGNMENT (LP-SOLVER)
        // We use 'javascript-lp-solver' to find the best DAY for each subject pool
        // to minimize the total days used while staying under campus capacity and student limits.
        this.logger.log(`[HYBRID_SOLVER] Modeling Master Day-Assignment with javascript-lp-solver...`);

        const model: any = {
            optimize: "objective",
            opType: "min",
            constraints: {},
            variables: {},
            ints: {}
        };

        const daysToTry = [0, 1, 2, 3, 4, 5]; 

        // 1. Define Day-Use variables in the objective
        daysToTry.forEach(day => {
            const dayVar = `day_${day}_used`;
            model.variables[dayVar] = { objective: 1000 }; // Heavy weight to minimize total days
            model.ints[dayVar] = 1;
            // Also prefer earlier days slightly to keep schedule compact at the start of the week
            model.variables[dayVar].objective += (day * 1); 
        });

        allPools.forEach((pool, pIdx) => {
            const varNamePrefix = `p${pIdx}`;
            const assignConstraint = `assign_p${pIdx}`;
            model.constraints[assignConstraint] = { equal: 1 };

            daysToTry.forEach(day => {
                const varName = `${varNamePrefix}_d${day}`;
                const poolDuration = pool.duration || 60;
                const dayVar = `day_${day}_used`;
                
                // Link pool assignment to day-use indicator: X_p_d - day_d_used <= 0
                const linkLabel = `link_p${pIdx}_d${day}`;
                model.constraints[linkLabel] = { max: 0 };

                model.variables[varName] = {
                    [assignConstraint]: 1,
                    [linkLabel]: 1,
                    // Track room-minutes usage
                    ...Object.keys(pool.campusNeeds).reduce((acc, camp) => {
                        const roomsNeeded = pool.campusNeeds[camp].numRooms;
                        acc[`cap_${camp}_d${day}`] = roomsNeeded * (poolDuration + this.MIN_GAP_MINUTES);
                        return acc;
                    }, {})
                };
                
                // Add negative link on dayVar: -1 * day_d_used
                model.variables[dayVar][linkLabel] = -1;
                
                model.ints[varName] = 1;
            });
        });

        // Add capacity constraints for each campus/day in minutes
        campusRooms.forEach((rooms, camp) => {
            daysToTry.forEach(day => {
                model.constraints[`cap_${camp}_d${day}`] = { max: rooms.length * this.MINUTES_PER_DAY };
            });
        });

        const lpResult = solver.Solve(model);
        this.logger.log(`[HYBRID_SOLVER] Master Plan feasibility: ${lpResult.feasible ? 'OPTIMAL' : 'FEASIBLE'}`);

        // 4. FINE-GRAINED SCHEDULING (CP-SOLVER)
        // Group pools by the day suggested by LP (shuffled for room placement)
        const dayAssignments = new Map<number, any[]>();
        Object.keys(lpResult).forEach(key => {
            if (lpResult[key] === 1 && key.startsWith('p')) {
                const [pPart, dPart] = key.split('_');
                const pIdx = parseInt(pPart.substring(1));
                const day = parseInt(dPart.substring(1));
                if (!dayAssignments.has(day)) dayAssignments.set(day, []);
                dayAssignments.get(day).push(allPools[pIdx]);
            }
        });

        const weekStates = new Map<number, any>();
        const getOrCreateState = (week: number) => {
            if (!weekStates.has(week)) {
                weekStates.set(week, { roomTimelines: new Map(), studentIntervals: new Map(), studentDayCounts: new Map() });
            }
            return weekStates.get(week);
        };

        const finalSchedule: ScheduledSession[] = [];
        const sortedDays = Array.from(dayAssignments.keys()).sort((a, b) => a - b);

        for (const day of sortedDays) {
            const poolsOnDay = dayAssignments.get(day);
            // Sort by duration/complexity for this specific day
            poolsOnDay.sort((a, b) => b.duration - a.duration);
            
            for (const pool of poolsOnDay) {
                const state = getOrCreateState(pool.weekNum);
                // Temporarily override DaySequence for this specific call to only check this DAY
                const results = this.assignSyncedSpecificDay(pool, campusRooms, semester.startDate, pool.weekNum, day, state, roomCapacityMap, constraints.busySlots);
                if (results.length > 0) {
                    finalSchedule.push(...results);
                } else {
                    this.logger.warn(`[HYBRID_SOLVER] Finding optimal slot for ${pool.subjectCode} on Day ${day}... Switching to Multi-Day Search.`);
                    // Fallback: search any other day
                    const fallback = this.assignSynced([pool], campusRooms, semester.startDate, pool.weekNum, state, true, roomCapacityMap, constraints.busySlots);
                    finalSchedule.push(...fallback);
                }
            }
        }

        this.logger.log(`[HYBRID_SOLVER] Optimization complete. Successfully scheduled ${finalSchedule.length} sessions.`);
        return finalSchedule;
    }

    private assignSyncedSpecificDay(pool: any, campusRooms: Map<Campus, string[]>, start: Date, week: number, day: number, state: any, roomCaps: any, busy: any): ScheduledSession[] {
        // Reuse logic but lock to one day
        return this.assignSynced([pool], campusRooms, start, week, state, false, roomCaps, busy, [day]);
    }


    private assignSynced(
        sessions: any[],
        campusRooms: Map<Campus, string[]>,
        semStartDate: Date,
        weekNum: number,
        state: {
            roomTimelines: Map<string, Map<number, number>>,
            studentIntervals: Map<string, Map<number, { start: number, end: number }[]>>,
            studentDayCounts: Map<string, Map<number, number>>
        },
        allowSpill: boolean,
        roomCapacityMap?: Map<string, number>,
        busySlots?: Map<string, Set<string>>,
        overrideDaySequence?: number[]
    ): ScheduledSession[] {
        if (sessions.length === 0) return [];

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
            daySequence = isPE ? [5, 6, 0, 1, 2, 3, 4] : [0, 1, 2, 3, 4, 5];
            if (!isPE && allowSpill) daySequence.push(7);
        }

        for (const session of sessions) {
            let scheduledForSubject = false;

            for (const day of daySequence) {
                if (scheduledForSubject) break;

                const dayStart = this.getStartOfDayTime(semStartDate, weekNum, day).getTime();
                const dayEnd = dayStart + this.MINUTES_PER_DAY * 60000;
                let currentAttemptStart = dayStart;

                while (currentAttemptStart + session.duration * 60000 <= dayEnd) {
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

                    if (!attemptIsPossible || roomsToUse.length === 0) break;

                    // 2. Adjust attempt start to respect room availability
                    const earliestPossibleStart = isPE 
                        ? currentAttemptStart 
                        : Math.max(currentAttemptStart, ...roomsToUse.map(r => r.nextAvailable));
                    
                    if (earliestPossibleStart + session.duration * 60000 > dayEnd) break;

                    // 3. PHASE 3: Iteratively schedule
                    let subjectSequencePointer = earliestPossibleStart;
                    for (const roomInfo of roomsToUse) {
                        let proposedStart = isPE ? Math.max(roomInfo.nextAvailable, subjectSequencePointer) : earliestPossibleStart;
                        const proposedEnd = proposedStart + session.duration * 60000;
                        const roomCap = roomCapacityMap?.get(roomInfo.roomId) || 30;
                        const need = session.campusNeeds[roomInfo.camp];
                        
                        const roomIdx = roomsToUse.filter(r => r.camp === roomInfo.camp).indexOf(roomInfo);
                        const roomStudents = need.studentCodes.slice(roomIdx * roomCap, (roomIdx + 1) * roomCap);

                        let studentConflict = false;
                        for (const s of roomStudents) {
                            if ((state.studentDayCounts.get(s)?.get(day) || 0) >= 2) {
                                studentConflict = true;
                                break;
                            }
                            const intervals = state.studentIntervals.get(s)?.get(day) || [];
                            for (const existing of intervals) {
                                if (proposedStart < existing.end && proposedEnd > existing.start) {
                                    studentConflict = true;
                                    break;
                                }
                            }
                            if (studentConflict) break;

                            if (busySlots?.has(s)) {
                                const searchDay = day === 7 ? 0 : day;
                                const busySets = busySlots.get(s);
                                for (let sl = 1; sl <= 6; sl++) {
                                    if (busySets.has(`${searchDay}_${sl}`)) {
                                        const bStart = dayStart + (sl - 1) * 100 * 60000;
                                        const bEnd = bStart + 90 * 60000;
                                        if (proposedStart < bEnd && proposedEnd > bStart) {
                                            studentConflict = true;
                                            break;
                                        }
                                    }
                                }
                            }
                            if (studentConflict) break;
                        }

                        if (studentConflict) {
                            attemptIsPossible = false;
                            break;
                        }

                        dayResults.push({
                            weekNum,
                            dayIndex: day,
                            slotIndex: 0, 
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
                        if (isPE) subjectSequencePointer = proposedEnd + this.MIN_GAP_MINUTES * 60000;
                    }

                    if (attemptIsPossible && dayResults.length === roomsToUse.length) {
                        for (const res of dayResults) {
                            const dayTimelines = state.roomTimelines.get(res.roomId);
                            dayTimelines.set(day, res.closeTime.getTime() + this.MIN_GAP_MINUTES * 60000);
                            for (const s of res.studentCodes) {
                                if (!state.studentIntervals.has(s)) state.studentIntervals.set(s, new Map());
                                if (!state.studentIntervals.get(s).has(day)) state.studentIntervals.get(s).set(day, []);
                                state.studentIntervals.get(s).get(day).push({ start: res.openTime.getTime(), end: res.closeTime.getTime() });
                                if (!state.studentDayCounts.has(s)) state.studentDayCounts.set(s, new Map());
                                const counts = state.studentDayCounts.get(s);
                                counts.set(day, (counts.get(day) || 0) + 1);
                            }
                        }
                        results.push(...dayResults);
                        scheduledForSubject = true;
                        break;
                    }
                    currentAttemptStart += 30 * 60000;
                }
            }
        }
        return results;
    }
     private getStartOfDayTime(semStart: Date, weekNum: number, dayOffset: number): Date {
        const date = new Date(semStart);
        const currentDay = date.getDay();
        const diffToMonday = currentDay === 0 ? 6 : currentDay - 1;
        date.setDate(date.getDate() - diffToMonday);
        date.setHours(0, 0, 0, 0);

        const totalDaysOffset = (weekNum - 1) * 7 + dayOffset;
        date.setDate(date.getDate() + totalDaysOffset);
        date.setHours(this.START_HOUR, this.START_MINUTE, 0, 0);

        return date;
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
