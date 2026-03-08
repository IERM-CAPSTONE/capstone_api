import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { Campus } from '@prisma/client';

export interface SchedulingConstraints {
    semesterId: string;
    campus: Campus;
    finalWeek: number;
    retakeWeek: number;
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

    // Major subjects (4 slots)
    private readonly MAJOR_SLOTS = [
        { open: '07:00' }, // Slot 1
        { open: '09:30' }, // Slot 2
        { open: '12:30' }, // Slot 3
        { open: '15:00' }, // Slot 4
    ];

    // Normal subjects (6 slots)
    private readonly NORMAL_SLOTS = [
        { open: '07:00' }, // Slot 1
        { open: '08:45' }, // Slot 2
        { open: '10:30' }, // Slot 3
        { open: '12:30' }, // Slot 4
        { open: '14:15' }, // Slot 5
        { open: '16:00' }, // Slot 6
    ];

    constructor(private readonly prisma: PrismaService) { }

    async generateSchedule(constraints: SchedulingConstraints): Promise<ScheduledSession[]> {
        this.logger.log(`Starting advanced scheduling for campus ${constraints.campus}`);

        // 1. Get Semester info for start date
        const semester = await this.prisma.semester.findUnique({
            where: { id: constraints.semesterId }
        });
        if (!semester) throw new Error(`Semester ${constraints.semesterId} not found`);

        // 2. Map Students to Subjects AND Campuses from CSV
        // Structure: Map<SubjectCode, Map<Campus, StudentCodes[]>>
        const subjectToCampusToStudents = new Map<string, Map<Campus, string[]>>();

        for (const item of constraints.excelData) {
            const subCode = item.subjectCode;
            const studentCode = item.studentCode;
            const campus = item.campus || constraints.campus;

            if (!subjectToCampusToStudents.has(subCode)) {
                subjectToCampusToStudents.set(subCode, new Map<Campus, string[]>());
            }
            const campusMap = subjectToCampusToStudents.get(subCode);
            if (!campusMap.has(campus)) {
                campusMap.set(campus, []);
            }
            campusMap.get(campus).push(studentCode);
        }

        const csvSubjectCodes = Array.from(subjectToCampusToStudents.keys());
        this.logger.log(`CSV contains ${csvSubjectCodes.length} unique subject codes.`);

        // 3. Get Subject details (Parts)
        const subjectsInDb = await this.prisma.subject.findMany({
            where: {
                semesterId: constraints.semesterId,
                code: { in: csvSubjectCodes }
            },
            include: { parts: { include: { examPart: true } } }
        });

        this.logger.log(`Found ${subjectsInDb.length} matching subjects in DB`);

        // Pre-fetch rooms to know capacity per campus
        const allRooms = await this.prisma.examRoom.findMany({
            where: { id: { in: constraints.roomIds } }
        });
        const campusCapacityMap = new Map<Campus, number>();
        allRooms.forEach(r => {
            const cap = (r as any).total_seats || ((r as any).max_rows * (r as any).max_columns) || 30;
            if (!campusCapacityMap.has(r.campus as Campus)) {
                campusCapacityMap.set(r.campus as Campus, cap);
            }
        });

        const finalSessions: any[] = [];
        const retakeSessions: any[] = [];
        const practicalSessions: any[] = [];
        const courseraFinalSessions: any[] = [];
        const courseraRetakeSessions: any[] = [];

        for (const sub of subjectsInDb) {
            const campusToStudents = subjectToCampusToStudents.get(sub.code) || new Map<Campus, string[]>();

            const campusNeeds: Record<string, { studentCodes: string[], numRooms: number }> = {};
            campusToStudents.forEach((students, camp) => {
                const capacity = campusCapacityMap.get(camp) || 30;
                campusNeeds[camp] = {
                    studentCodes: this.shuffle(students),
                    numRooms: Math.ceil(students.length / capacity)
                };
            });

            if (Object.keys(campusNeeds).length === 0) continue;

            if ((sub as any).isCoursera) {
                if (sub.parts.length === 0) continue;
                const totalDuration = sub.parts.reduce((acc, p) => acc + (p.duration || 180), 0);
                const allPartIds = sub.parts.map(p => p.examPartId);
                const sessionData = {
                    subjectCode: sub.code,
                    campusNeeds,
                    duration: totalDuration,
                    examPartIds: allPartIds,
                    examType: 'FE' as const,
                    partName: sub.parts.map(p => p.examPart.code.toUpperCase()).join('+'),
                    note: sub.parts.length > 1 ? sub.parts.map(p => p.examPart.code.toUpperCase()).join(', ') : undefined,
                    isMajor: true,
                };

                courseraFinalSessions.push(sessionData);
                courseraRetakeSessions.push({
                    ...sessionData,
                    examType: 'RE' as const,
                    note: sessionData.note ? `${sessionData.note} (Retake)` : 'Retake'
                });
            } else {
                const peParts: any[] = [];
                const nonPeParts: any[] = [];

                for (const part of sub.parts) {
                    const typeCode = (part.examPart?.code || '').toUpperCase();
                    const typeName = (part.examPart?.name || '').toUpperCase();
                    const isPE = typeCode === 'PE' || typeCode === 'P' || typeCode.includes('PRACTICAL') || typeName.includes('THỰC HÀNH');
                    if (isPE) peParts.push(part);
                    else nonPeParts.push(part);
                }

                for (const pe of peParts) {
                    practicalSessions.push({
                        subjectCode: sub.code,
                        campusNeeds,
                        duration: pe.duration || 90,
                        examPartIds: [pe.examPartId],
                        examType: 'PE' as const,
                        partName: pe.examPart.name,
                        isMajor: true,
                    });
                }

                if (nonPeParts.length > 0) {
                    const totalDuration = nonPeParts.reduce((acc, p) => acc + (p.duration || 60), 0);
                    const allPartIds = nonPeParts.map(p => p.examPartId);
                    const hasTE = nonPeParts.some(p => {
                        const c = p.examPart.code.toUpperCase();
                        return c === 'TE' || c === 'T';
                    });
                    const hasRetake = nonPeParts.some(p => p.examPart.code.toUpperCase().includes('RE'));

                    const sessionData = {
                        subjectCode: sub.code,
                        campusNeeds,
                        duration: totalDuration,
                        examPartIds: allPartIds,
                        examType: (hasTE ? 'TE' : 'FE') as 'FE' | 'TE',
                        note: nonPeParts.length > 1 ? nonPeParts.map(p => p.examPart.code.toUpperCase()).join(', ') : undefined,
                        isMajor: (sub as any).isMajor,
                    };

                    if (hasRetake) {
                        retakeSessions.push({ ...sessionData, examType: 'RE' as const });
                    } else {
                        finalSessions.push(sessionData);
                        retakeSessions.push({
                            ...sessionData,
                            examType: 'RE' as const,
                            note: sessionData.note ? `${sessionData.note} (Retake)` : 'Retake'
                        });
                    }
                }
            }
        }

        const allScheduled: ScheduledSession[] = [];
        const rooms = await this.prisma.examRoom.findMany({ where: { id: { in: constraints.roomIds } } });
        const campusRooms = new Map<Campus, string[]>();
        const roomCapacityMap = new Map<string, number>();
        rooms.forEach(r => {
            if (!campusRooms.has(r.campus as Campus)) campusRooms.set(r.campus as Campus, []);
            campusRooms.get(r.campus as Campus).push(r.id);
            const cap = (r as any).total_seats || ((r as any).max_rows * (r as any).max_columns) || 30;
            roomCapacityMap.set(r.id, cap);
        });

        // practicalWeek
        if (constraints.practicalWeek && practicalSessions.length > 0) {
            allScheduled.push(...this.assignSynced(practicalSessions, campusRooms, semester.startDate, constraints.practicalWeek, true, roomCapacityMap, constraints.busySlots));
        }

        // courseraWeek
        const courseraFinalWeek = constraints.courseraWeek ?? constraints.finalWeek;
        if (courseraFinalSessions.length > 0) {
            allScheduled.push(...this.assignSynced(courseraFinalSessions, campusRooms, semester.startDate, courseraFinalWeek, true, roomCapacityMap, constraints.busySlots));
        }

        // courseraRetakeWeek
        const courseraRetakeWeekNum = constraints.courseraRetakeWeek ?? constraints.retakeWeek;
        if (courseraRetakeSessions.length > 0) {
            allScheduled.push(...this.assignSynced(courseraRetakeSessions, campusRooms, semester.startDate, courseraRetakeWeekNum, true, roomCapacityMap, constraints.busySlots));
        }

        // Final Week - Major
        const majorFinals = finalSessions.filter(s => s.isMajor);
        if (majorFinals.length > 0) {
            allScheduled.push(...this.assignSynced(majorFinals, campusRooms, semester.startDate, constraints.finalWeek, true, roomCapacityMap, constraints.busySlots));
        }

        // Final Week - Non-Major
        const normalFinals = finalSessions.filter(s => !s.isMajor);
        if (normalFinals.length > 0) {
            allScheduled.push(...this.assignSynced(normalFinals, campusRooms, semester.startDate, constraints.finalWeek, true, roomCapacityMap, constraints.busySlots));
        }

        // Retake Week - Major
        const majorRetakes = retakeSessions.filter(s => s.isMajor);
        if (majorRetakes.length > 0) {
            allScheduled.push(...this.assignSynced(majorRetakes, campusRooms, semester.startDate, constraints.retakeWeek, true, roomCapacityMap, constraints.busySlots));
        }

        // Retake Week - Non-Major
        const normalRetakes = retakeSessions.filter(s => !s.isMajor);
        if (normalRetakes.length > 0) {
            allScheduled.push(...this.assignSynced(normalRetakes, campusRooms, semester.startDate, constraints.retakeWeek, true, roomCapacityMap, constraints.busySlots));
        }

        return allScheduled;
    }

    private assignSynced(
        sessions: any[],
        campusRooms: Map<Campus, string[]>,
        semStartDate: Date,
        weekNum: number,
        allowSpill: boolean,
        roomCapacityMap?: Map<string, number>,
        busySlots?: Map<string, Set<string>>
    ): ScheduledSession[] {
        if (sessions.length === 0) return [];

        const results: ScheduledSession[] = [];
        const studentSchedules = new Map<string, Map<number, number>>();
        const roomUsage = new Map<string, Map<Campus, string[]>>(); // key: "day_slot"
        const globalSlotLoad = new Map<string, number>(); // key: "day_slot", value: total rooms assigned

        const isMajor = sessions[0].isMajor;
        const slots = isMajor ? this.MAJOR_SLOTS : this.NORMAL_SLOTS;

        // Sort sessions by "difficulty" (total rooms needed across all campuses)
        sessions.sort((a, b) => {
            const sumA = Object.values(a.campusNeeds).reduce<number>((acc, val: any) => acc + (Number(val.numRooms) || 0), 0);
            const sumB = Object.values(b.campusNeeds).reduce<number>((acc, val: any) => acc + (Number(val.numRooms) || 0), 0);
            if (Number(b.duration) !== Number(a.duration)) return (Number(b.duration) || 0) - (Number(a.duration) || 0);
            return sumB - sumA;
        });

        const isPE = sessions[0].examType === 'PE';
        const daySequence = isPE ? [5, 6, 0, 1, 2, 3, 4] : [0, 1, 2, 3, 4];
        if (!isPE && allowSpill) daySequence.push(7);
        if (!isPE) daySequence.push(5, 6);

        for (const session of sessions) {
            let bestDay = -1;
            let bestSlot = -1;
            let minLoad = Infinity;

            // Find the best slot for this session based on "Least Loaded" principle
            for (const day of daySequence) {
                for (let slot = 0; slot < slots.length; slot++) {
                    const key = `${day}_${slot}`;

                    // Initialize availability for this slot if not exists
                    if (!roomUsage.has(key)) {
                        const availabilityMap = new Map<Campus, string[]>();
                        campusRooms.forEach((ids, c) => availabilityMap.set(c, [...ids]));
                        roomUsage.set(key, availabilityMap);
                        globalSlotLoad.set(key, 0);
                    }

                    const currentAvailability = roomUsage.get(key);

                    // 1. Check room availability across all campuses
                    let canHost = true;
                    for (const campStr of Object.keys(session.campusNeeds)) {
                        const camp = campStr as Campus;
                        const needed = session.campusNeeds[camp].numRooms;
                        const available = currentAvailability.get(camp)?.length || 0;
                        if (available < needed) {
                            canHost = false;
                            break;
                        }
                    }
                    if (!canHost) continue;

                    // 2. Check student conflicts (0% conflict rule)
                    const allStudents: string[] = [];
                    Object.values(session.campusNeeds).forEach((need: any) => allStudents.push(...need.studentCodes));

                    let hasConflict = false;
                    for (const s of allStudents) {
                        const dayCounts = studentSchedules.get(s) || new Map();
                        // Rule: Max 2 exams per day
                        if ((dayCounts.get(day) || 0) >= 2) {
                            hasConflict = true;
                            break;
                        }
                        // Rule: Class schedule conflict
                        if (busySlots?.has(s)) {
                            const studentBusy = busySlots.get(s);
                            if (studentBusy.has(`${day}_${slot + 1}`)) { // Slot from Excel is 1-indexed
                                hasConflict = true;
                                break;
                            }
                        }
                    }
                    if (hasConflict) continue;

                    // 3. Selection: Pick the slot with the lowest current room load to balance
                    const currentLoad = globalSlotLoad.get(key) || 0;
                    if (currentLoad < minLoad) {
                        minLoad = currentLoad;
                        bestDay = day;
                        bestSlot = slot;
                    }
                }
            }

            // If we found a valid slot, assign it
            if (bestDay !== -1 && bestSlot !== -1) {
                const key = `${bestDay}_${bestSlot}`;
                const currentAvailability = roomUsage.get(key);
                let sessionTotalRooms = 0;

                for (const campStr of Object.keys(session.campusNeeds)) {
                    const camp = campStr as Campus;
                    const need = session.campusNeeds[camp];
                    const available = currentAvailability.get(camp);
                    const usedRooms = available.splice(0, need.numRooms);
                    sessionTotalRooms += usedRooms.length;

                    for (let r = 0; r < usedRooms.length; r++) {
                        const roomId = usedRooms[r];
                        const roomCap = roomCapacityMap?.get(roomId) || 30;
                        const roomStudents = need.studentCodes.slice(r * roomCap, (r + 1) * roomCap);

                        // Synchronization: calculateOpenTime now provides same time for all
                        const openTime = this.calculateOpenTime(semStartDate, weekNum, bestDay, bestSlot, camp, slots);
                        const closeTime = this.calculateCloseTime(openTime, session.duration, camp);

                        results.push({
                            weekNum,
                            dayIndex: bestDay,
                            slotIndex: bestSlot,
                            subjectCode: session.subjectCode,
                            studentCodes: roomStudents,
                            roomId,
                            campus: camp as string,
                            examPartIds: session.examPartIds,
                            examType: session.examType,
                            openTime,
                            closeTime,
                            duration: session.duration,
                            note: session.note
                        });

                        // Update student daily count
                        roomStudents.forEach(s => {
                            if (!studentSchedules.has(s)) studentSchedules.set(s, new Map());
                            studentSchedules.get(s).set(bestDay, (studentSchedules.get(s).get(bestDay) || 0) + 1);
                        });
                    }
                }
                // Update the load for this slot
                globalSlotLoad.set(key, (globalSlotLoad.get(key) || 0) + sessionTotalRooms);
            }
        }
        return results;
    }

    private calculateOpenTime(semStart: Date, weekNum: number, dayOffset: number, slotIndex: number, campus: Campus, slotsArray: { open: string }[]): Date {
        const date = new Date(semStart);
        const totalDaysOffset = (weekNum - 1) * 7 + dayOffset;
        date.setDate(date.getDate() + totalDaysOffset);

        const slot = slotsArray[slotIndex];
        const [hour, minute] = slot.open.split(':').map(Number);

        // Base Opening Time (synchronized across campuses)
        const openingTime = new Date(date);
        openingTime.setHours(hour, minute, 0, 0);

        // Temporarily commented out campus offset logic (Lệch giờ)
        /*
        const offset = (campus === Campus.DN) ? 30 : 15;
        openingTime.setMinutes(openingTime.getMinutes() - offset);
        */

        return openingTime;
    }

    private calculateCloseTime(openTime: Date, duration: number, campus: Campus): Date {
        // Temporarily commented out campus offset logic (Lệch giờ)
        /*
        const offset = (campus === Campus.DN) ? 30 : 15;
        const openingTime = openTime.getTime() + (offset * 60000);
        return new Date(openingTime + duration * 60000);
        */

        // Default to baseline opening + duration
        return new Date(openTime.getTime() + duration * 60000);
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
