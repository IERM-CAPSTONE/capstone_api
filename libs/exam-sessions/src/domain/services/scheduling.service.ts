import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@app/prisma';
import { v4 as uuidv4 } from 'uuid';
import { Campus } from '@prisma/client';

export interface SchedulingConstraints {
    semesterId: string;
    campus: Campus;
    finalWeek: number;
    retakeWeek: number;
    roomIds: string[];
    excelData: { studentCode: string; subjectCode: string }[];
}

export interface ScheduledSession {
    weekNum: number;
    dayIndex: number; // 0 (Mon) to 6 (Sun)
    slotIndex: number;
    subjectCode: string;
    studentCodes: string[];
    roomId: string;
    examTypeId: string;
    openTime: Date;
    closeTime: Date;
    duration: number;
}

@Injectable()
export class SchedulingService {
    private readonly logger = new Logger(SchedulingService.name);

    // Giờ mở đề đồng bộ theo yêu cầu
    private readonly SLOTS = [
        { open: '07:30' }, // Slot 1
        { open: '09:10' }, // Slot 2
        { open: '10:50' }, // Slot 3
        { open: '12:50' }, // Slot 4
        { open: '14:30' }, // Slot 5
        { open: '16:10' }, // Slot 6
        { open: '16:20' }, // Slot 7
    ];

    constructor(private readonly prisma: PrismaService) { }

    async generateSchedule(constraints: SchedulingConstraints): Promise<ScheduledSession[]> {
        this.logger.log(`Starting advanced scheduling for campus ${constraints.campus}`);

        // 1. Get Semester info for start date
        const semester = await this.prisma.semester.findUnique({
            where: { id: constraints.semesterId }
        });
        if (!semester) throw new Error(`Semester ${constraints.semesterId} not found`);

        // 2. Map Students to Subjects from CSV
        const subjectToStudents = new Map<string, string[]>();
        const studentToSubjects = new Map<string, string[]>();

        for (const item of constraints.excelData) {
            if (!subjectToStudents.has(item.subjectCode)) subjectToStudents.set(item.subjectCode, []);
            subjectToStudents.get(item.subjectCode).push(item.studentCode);

            if (!studentToSubjects.has(item.studentCode)) studentToSubjects.set(item.studentCode, []);
            studentToSubjects.get(item.studentCode).push(item.subjectCode);
        }

        // 3. Get Subject details (Parts)
        const subjectsInDb = await this.prisma.subject.findMany({
            where: {
                semesterId: constraints.semesterId,
                code: { in: Array.from(subjectToStudents.keys()) }
            },
            include: { parts: { include: { examType: true } } }
        });

        const finalSessions: any[] = [];
        const retakeSessions: any[] = [];

        for (const sub of subjectsInDb) {
            const students = subjectToStudents.get(sub.code) || [];
            for (const part of sub.parts) {
                const isRetake = part.examType.code.toUpperCase().includes('RE');
                const sessionData = {
                    subjectCode: sub.code,
                    students,
                    duration: part.duration || 90,
                    examTypeId: part.examTypeId,
                    partName: part.examType.name,
                    numRoomsNeeded: Math.ceil(students.length / 20),
                };

                if (isRetake) retakeSessions.push(sessionData);
                else finalSessions.push(sessionData);
            }
        }

        // 4. Run assignment logic
        const allScheduled: ScheduledSession[] = [];

        // Final Week (Tuần finalWeek) - allows spilling to Mon of next week
        const finalResults = this.assign(
            finalSessions,
            constraints.roomIds,
            constraints.campus,
            semester.startDate,
            constraints.finalWeek,
            true // Allow spill to next Mon
        );
        allScheduled.push(...finalResults);

        // Retake Week (Tuần retakeWeek)
        const retakeResults = this.assign(
            retakeSessions,
            constraints.roomIds,
            constraints.campus,
            semester.startDate,
            constraints.retakeWeek,
            false // No spill
        );
        allScheduled.push(...retakeResults);

        return allScheduled;
    }

    private assign(
        sessions: any[],
        roomIds: string[],
        campus: Campus,
        semStartDate: Date,
        weekNum: number,
        allowSpill: boolean
    ): ScheduledSession[] {
        const results: ScheduledSession[] = [];
        const studentSchedules = new Map<string, Map<number, number>>(); // Student -> Map<DayOffset, ExamCount>
        const roomAvailability = new Map<string, string[]>(); // Key: "dayOffset_slotIndex", Value: roomIds[]

        // Preparation: Sort session by duration and size
        sessions.sort((a, b) => b.duration - a.duration || b.students.length - a.students.length);

        const maxDays = allowSpill ? 7 : 6; // Mon-Sat + (maybe) next Mon

        for (const session of sessions) {
            let scheduled = false;

            for (let day = 0; day < maxDays && !scheduled; day++) {
                // Skip Sat/Sun if preference
                if (day === 6) continue; // Sunday
                if (day === 5 && campus === Campus.QN) continue; // Saturday for QN

                for (let slot = 0; slot < this.SLOTS.length && !scheduled; slot++) {
                    const key = `${day}_${slot}`;
                    if (!roomAvailability.has(key)) roomAvailability.set(key, [...roomIds]);

                    const availableRooms = roomAvailability.get(key);
                    if (availableRooms.length < session.numRoomsNeeded) continue;

                    // Constraint Check: Max 2/day for students
                    let countViolation = 0;
                    for (const s of session.students) {
                        const dayCounts = studentSchedules.get(s) || new Map();
                        if ((dayCounts.get(day) || 0) >= 2) {
                            countViolation++;
                        }
                    }

                    // Flexible constraint: If > 5% of students can't take it, find another slot
                    if (countViolation > session.students.length * 0.05) continue;

                    // SUCCESS - assign!
                    const usedRooms = availableRooms.splice(0, session.numRoomsNeeded);

                    // Create ScheduledSession objects
                    for (let r = 0; r < usedRooms.length; r++) {
                        const roomId = usedRooms[r];
                        const roomStudents = session.students.slice(r * 20, (r + 1) * 20);

                        // Calculate Date & Time
                        const openTime = this.calculateOpenTime(semStartDate, weekNum, day, slot, campus);
                        const closeTime = this.calculateCloseTime(openTime, session.duration, campus);

                        results.push({
                            weekNum,
                            dayIndex: day,
                            slotIndex: slot,
                            subjectCode: session.subjectCode,
                            studentCodes: roomStudents,
                            roomId,
                            examTypeId: session.examTypeId,
                            openTime,
                            closeTime,
                            duration: session.duration
                        });

                        // Update student counts
                        roomStudents.forEach(s => {
                            if (!studentSchedules.has(s)) studentSchedules.set(s, new Map());
                            const dayCounts = studentSchedules.get(s);
                            dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
                        });
                    }
                    scheduled = true;
                }
            }
        }

        return results;
    }

    private calculateOpenTime(semStart: Date, weekNum: number, dayOffset: number, slotIndex: number, campus: Campus): Date {
        const date = new Date(semStart);
        // Week W starts at (W-1)*7 days offset
        const totalDaysOffset = (weekNum - 1) * 7 + dayOffset;
        date.setDate(date.getDate() + totalDaysOffset);

        const slot = this.SLOTS[slotIndex];
        const [hour, minute] = slot.open.split(':').map(Number);
        date.setHours(hour, minute, 0, 0);

        // DN campus starts preparation 30m early
        if (campus === Campus.DN) {
            date.setMinutes(date.getMinutes() - 30);
        }

        return date;
    }

    private calculateCloseTime(openTime: Date, duration: number, campus: Campus): Date {
        const closeTime = new Date(openTime.getTime() + duration * 60000);

        // Campus specific buffer
        if (campus === Campus.HN || campus === Campus.HCM) {
            closeTime.setMinutes(closeTime.getMinutes() + 30);
        }

        return closeTime;
    }

    /**
     * Thuật toán dãn cách chỗ ngồi: Tính toán hàng/cột sao cho sinh viên ngồi xa nhau nhất
     */
    assignSeats(numStudents: number, maxRows: number, maxCols: number): { row: number; col: number }[] {
        const totalSeats = maxRows * maxCols;
        if (numStudents > totalSeats) {
            this.logger.warn(`Number of students (${numStudents}) exceeds total seats (${totalSeats})`);
        }

        const seats: { row: number; col: number }[] = [];
        const step = totalSeats / numStudents;

        for (let i = 0; i < numStudents; i++) {
            const seatIndex = Math.floor(i * step);
            const row = Math.floor(seatIndex / maxCols) + 1; // 1-indexed
            const col = (seatIndex % maxCols) + 1; // 1-indexed
            seats.push({ row, col });
        }

        return seats;
    }
}
