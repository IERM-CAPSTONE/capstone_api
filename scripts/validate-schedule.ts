
import * as dotenv from 'dotenv';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.join(process.cwd(), envFile) });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function validateSchedule(semesterId: string) {
    console.log(`🔍 Validating schedule for semester: ${semesterId}`);
    
    // 1. Get all draft sessions for this semester
    const sessions = await prisma.examSession.findMany({
        where: { semesterId, status: 'Draft' },
        include: {
            studentExams: {
                include: { student: true }
            },
            examRoom: true
        }
    });

    console.log(`📊 Found ${sessions.length} draft sessions.`);

    const errors: string[] = [];
    const studentSchedules = new Map<string, { start: Date, end: Date, sessionId: string }[]>();
    const roomSchedules = new Map<string, { start: Date, end: Date, sessionId: string }[]>();

    for (const session of sessions) {
        const start = session.examOpenTime;
        const end = session.examCloseTime;

        // Check Room Overlaps
        const roomId = session.examRoomId;
        if (!roomSchedules.has(roomId)) roomSchedules.set(roomId, []);
        const roomHistory = roomSchedules.get(roomId)!;
        for (const prev of roomHistory) {
            if (start < prev.end && end > prev.start) {
                errors.push(`❌ Room Conflict: Room ${session.examRoom?.roomNumber} has overlapping sessions: ${session.id} and ${prev.sessionId}`);
            }
        }
        roomHistory.push({ start, end, sessionId: session.id });

        // Check Student Conflicts
        for (const se of session.studentExams) {
            const studentCode = se.student.code || se.student.username;
            if (!studentSchedules.has(studentCode)) studentSchedules.set(studentCode, []);
            const studentHistory = studentSchedules.get(studentCode)!;
            
            for (const prev of studentHistory) {
                // Same time overlap
                if (start < prev.end && end > prev.start) {
                    errors.push(`❌ Student Conflict: Student ${studentCode} is in two overlapping sessions: ${session.id} and ${prev.sessionId}`);
                }
            }
            studentHistory.push({ start, end, sessionId: session.id });
        }
    }

    // Check Daily Load (> 2 exams/day)
    for (const [code, history] of studentSchedules.entries()) {
        const dailyCount = new Map<string, number>();
        for (const item of history) {
            const dateStr = item.start.toISOString().split('T')[0];
            dailyCount.set(dateStr, (dailyCount.get(dateStr) || 0) + 1);
        }
        for (const [date, count] of dailyCount.entries()) {
            if (count > 2) {
                errors.push(`⚠️ Student Load Alert: Student ${code} has ${count} exams on ${date}`);
            }
        }
    }

    if (errors.length === 0) {
        console.log('✅ All checks passed! The schedule logic appears correct.');
    } else {
        console.log('🛑 Validation failed with following issues:');
        errors.forEach(err => console.log(err));
    }
}

const semesterId = process.argv[2];
if (!semesterId) {
    console.error('Please provide a semester ID.');
    process.exit(1);
}

validateSchedule(semesterId)
    .catch(console.error)
    .finally(() => prisma.$disconnect());
