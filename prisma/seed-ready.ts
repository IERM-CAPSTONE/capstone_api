import * as dotenv from 'dotenv';
import * as path from 'path';
import { PrismaClient, Campus, ExamSeatStatus, ExamSessionStatus, ExamType, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.join(process.cwd(), envFile) });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type SeedSubject = {
  code: string;
  name: string;
  isCoursera?: boolean;
  parts: Array<{ code: string; duration: number }>;
};

const SUBJECTS: SeedSubject[] = [
  { code: 'MAE101', name: 'Mathematics for Engineering', parts: [{ code: 'FE', duration: 90 }, { code: 'RE', duration: 90 }] },
  { code: 'PRF212', name: 'Programming Fundamentals', parts: [{ code: 'FE', duration: 90 }, { code: 'PE', duration: 60 }, { code: 'RE', duration: 90 }] },
  { code: 'IOT101', name: 'Introduction to IoT', parts: [{ code: 'FE', duration: 90 }, { code: 'RE', duration: 90 }] },
  { code: 'CS101', name: 'Computer Science Basics', parts: [{ code: 'FE', duration: 90 }] },
  { code: 'CS201', name: 'Data Structures', parts: [{ code: 'FE', duration: 90 }, { code: 'RE', duration: 90 }] },
  { code: 'CS302', name: 'Operating Systems', parts: [{ code: 'FE', duration: 90 }, { code: 'RE', duration: 90 }] },
  { code: 'MATH101', name: 'Calculus I', parts: [{ code: 'FE', duration: 90 }] },
  { code: 'ENG101', name: 'English for IT', parts: [{ code: 'FE', duration: 60 }, { code: 'RE', duration: 60 }] },
  { code: 'PHY101', name: 'Physics for Computing', parts: [{ code: 'FE', duration: 90 }] },
  { code: 'CHEM101', name: 'Applied Chemistry', parts: [{ code: 'FE', duration: 90 }] },
  { code: 'BIO101', name: 'Biology Basics', parts: [{ code: 'FE', duration: 90 }] },
  { code: 'HIS101', name: 'World History', parts: [{ code: 'FE', duration: 60 }] },
];

const EXAM_PARTS = [
  { code: 'FE', name: 'Final Exam', description: 'Final Examination' },
  { code: 'PE', name: 'Practical Exam', description: 'Practical Examination' },
  { code: 'TE', name: 'Test', description: 'Regular Test' },
  { code: 'RE', name: 'Retake Exam', description: 'Retake Examination' },
  { code: 'R', name: 'Reading', description: 'Reading Component' },
  { code: 'L', name: 'Listening', description: 'Listening Component' },
  { code: 'W', name: 'Writing', description: 'Writing Component' },
  { code: 'S', name: 'Speaking', description: 'Speaking Component' },
  { code: 'MC', name: 'Multiple Choice', description: 'Multiple Choice Questions' },
];

const CAMPUS: Campus = 'HCM';

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

async function resetData() {
  const safeDelete = async (label: string, work: () => Promise<unknown>) => {
    try {
      await work();
    } catch (error: any) {
      // Some local DBs are behind migrations; skip missing-table errors so seed can still prepare core data.
      if (error?.code === 'P2021') {
        console.warn(`⚠️ Skipping cleanup for ${label}: table missing in current database`);
        return;
      }
      throw error;
    }
  };

  await safeDelete('ActivityHistory', () => prisma.activityHistory.deleteMany({}));
  await safeDelete('StudentExamPart', () => prisma.studentExamPart.deleteMany({}));
  await safeDelete('StudentExam', () => prisma.studentExam.deleteMany({}));
  await safeDelete('ExamSeat', () => prisma.examSeat.deleteMany({}));
  await safeDelete('ProctorAssignment', () => prisma.proctorAssignment.deleteMany({}));
  await safeDelete('ExamSession', () => prisma.examSession.deleteMany({}));
  await safeDelete('SubjectPart', () => prisma.subjectPart.deleteMany({}));
  await safeDelete('Subject', () => prisma.subject.deleteMany({}));
  await safeDelete('ExamPart', () => prisma.examPart.deleteMany({}));
  await safeDelete('ExamRoom', () => prisma.examRoom.deleteMany({}));
  await safeDelete('Semester', () => prisma.semester.deleteMany({}));
  await safeDelete('User', () => prisma.user.deleteMany({}));
}

async function seedUsers() {
  const users = [] as { id: string; code: string; role: Role }[];

  const admin = await prisma.user.upsert({
    where: { email: 'admin@exam.com' },
    update: {
      fullName: 'System Administrator',
      code: 'ADMIN001',
      role: 'ADMIN',
      campus: CAMPUS,
      isActive: true,
    },
    create: {
      email: 'admin@exam.com',
      fullName: 'System Administrator',
      code: 'ADMIN001',
      role: 'ADMIN',
      campus: CAMPUS,
      isActive: true,
    },
  });
  users.push({ id: admin.id, code: admin.code || '', role: 'ADMIN' });

  const officer = await prisma.user.upsert({
    where: { email: 'officer@exam.com' },
    update: {
      fullName: 'Chief Exam Officer',
      code: 'EO001',
      role: 'EXAM_OFFICER',
      campus: CAMPUS,
      isActive: true,
    },
    create: {
      email: 'officer@exam.com',
      fullName: 'Chief Exam Officer',
      code: 'EO001',
      role: 'EXAM_OFFICER',
      campus: CAMPUS,
      isActive: true,
    },
  });
  users.push({ id: officer.id, code: officer.code || '', role: 'EXAM_OFFICER' });

  for (let i = 1; i <= 5; i++) {
    const email = `proctor${i}@exam.com`;
    const proctor = await prisma.user.upsert({
      where: { email },
      update: {
        fullName: `Proctor ${i}`,
        code: `PROC${String(i).padStart(3, '0')}`,
        role: 'PROCTOR',
        campus: CAMPUS,
        isActive: true,
      },
      create: {
        email,
        fullName: `Proctor ${i}`,
        code: `PROC${String(i).padStart(3, '0')}`,
        role: 'PROCTOR',
        campus: CAMPUS,
        isActive: true,
      },
    });
    users.push({ id: proctor.id, code: proctor.code || '', role: 'PROCTOR' });
  }

  for (let i = 1; i <= 50; i++) {
    const email = `student${i}@exam.com`;
    const student = await prisma.user.upsert({
      where: { email },
      update: {
        fullName: `Student ${i}`,
        code: `SE${String(i).padStart(4, '0')}`,
        role: 'STUDENT',
        campus: CAMPUS,
        isActive: true,
      },
      create: {
        email,
        fullName: `Student ${i}`,
        code: `SE${String(i).padStart(4, '0')}`,
        role: 'STUDENT',
        campus: CAMPUS,
        isActive: true,
      },
    });
    users.push({ id: student.id, code: student.code || '', role: 'STUDENT' });
  }

  return users;
}

async function seedSemesterAndSubjects() {
  const semester = await prisma.semester.create({
    data: {
      code: 'SU26',
      name: 'Summer 2026',
      startDate: new Date('2026-05-10T00:00:00.000Z'),
      endDate: new Date('2026-08-31T23:59:59.999Z'),
    },
  });

  for (const part of EXAM_PARTS) {
    await prisma.examPart.create({ data: part });
  }

  const examPartMap = new Map((await prisma.examPart.findMany()).map((item) => [item.code, item.id]));

  for (const subject of SUBJECTS) {
    const createdSubject = await prisma.subject.create({
      data: {
        code: subject.code,
        name: subject.name,
        semesterId: semester.id,
        isCoursera: subject.isCoursera ?? false,
      },
    });

    for (const part of subject.parts) {
      const examPartId = examPartMap.get(part.code);
      if (!examPartId) {
        throw new Error(`ExamPart ${part.code} missing while seeding SubjectPart for ${subject.code}`);
      }
      await prisma.subjectPart.create({
        data: {
          subjectId: createdSubject.id,
          examPartId,
          duration: part.duration,
        },
      });
    }
  }

  return semester;
}

async function seedRooms() {
  const roomSpecs = [
    { roomNumber: 'A101', max_rows: 6, max_columns: 5, capacity: 30 },
    { roomNumber: 'A102', max_rows: 6, max_columns: 5, capacity: 30 },
    { roomNumber: 'B101', max_rows: 5, max_columns: 5, capacity: 25 },
    { roomNumber: 'B102', max_rows: 5, max_columns: 5, capacity: 25 },
    { roomNumber: 'B103', max_rows: 5, max_columns: 5, capacity: 25 },
    { roomNumber: 'B104', max_rows: 5, max_columns: 5, capacity: 25 },
    { roomNumber: 'C101', max_rows: 5, max_columns: 4, capacity: 20 },
    { roomNumber: 'C102', max_rows: 5, max_columns: 4, capacity: 20 },
    { roomNumber: 'C103', max_rows: 5, max_columns: 4, capacity: 20 },
    { roomNumber: 'C104', max_rows: 5, max_columns: 4, capacity: 20 },
  ];

  const rooms = [];
  for (const room of roomSpecs) {
    const created = await prisma.examRoom.create({
      data: {
        ...room,
        total_seats: room.max_rows * room.max_columns,
        status: 'Available',
        campus: CAMPUS,
      },
    });
    rooms.push(created);
  }

  return rooms;
}

async function seedSessionsWithSeats(
  semesterId: string,
  rooms: Array<{ id: string; max_rows: number | null; max_columns: number | null }>,
  users: Array<{ id: string; code: string; role: Role }>,
) {
  const proctors = users.filter((u) => u.role === 'PROCTOR');
  const students = users.filter((u) => u.role === 'STUDENT');

  const now = new Date();
  const sessionDefinitions: Array<{
    subjectCode: string;
    examType: ExamType;
    status: ExamSessionStatus;
    startOffsetDays: number;
  }> = [
    { subjectCode: 'MAE101', examType: 'FE', status: 'Scheduled', startOffsetDays: 2 },
    { subjectCode: 'PRF212', examType: 'FE', status: 'Scheduled', startOffsetDays: 3 },
    { subjectCode: 'IOT101', examType: 'FE', status: 'Scheduled', startOffsetDays: 4 },
    { subjectCode: 'CS101', examType: 'FE', status: 'Scheduled', startOffsetDays: 5 },
    { subjectCode: 'CS201', examType: 'RE', status: 'Scheduled', startOffsetDays: 6 },
    { subjectCode: 'PRF212', examType: 'PE', status: 'Ongoing', startOffsetDays: -1 },
  ];

  const sessions: string[] = [];

  for (let i = 0; i < sessionDefinitions.length; i++) {
    const def = sessionDefinitions[i];
    const room = rooms[i % rooms.length];
    const start = addDays(now, def.startOffsetDays);
    const end = addDays(start, 0);
    end.setHours(end.getHours() + 2);

    const session = await prisma.examSession.create({
      data: {
        semesterId,
        subjectCode: def.subjectCode,
        examType: def.examType,
        examRoomId: room.id,
        campus: CAMPUS,
        status: def.status,
        examOpenTime: start,
        examCloseTime: end,
        proctorId: proctors[i % proctors.length]?.id,
        hallInvigilatorId: proctors[(i + 1) % proctors.length]?.id,
      },
    });

    const seats = [] as Array<{ examSessionId: string; row: number; col: number; status: ExamSeatStatus }>;
    const maxRows = room.max_rows || 0;
    const maxCols = room.max_columns || 0;
    for (let row = 1; row <= maxRows; row++) {
      for (let col = 1; col <= maxCols; col++) {
        seats.push({ examSessionId: session.id, row, col, status: 'Available' });
      }
    }
    if (seats.length > 0) {
      await prisma.examSeat.createMany({ data: seats });
    }

    const sessionSeats = await prisma.examSeat.findMany({ where: { examSessionId: session.id }, orderBy: [{ row: 'asc' }, { col: 'asc' }] });
    const assignedCount = Math.min(12, sessionSeats.length);

    for (let idx = 0; idx < assignedCount; idx++) {
      const seat = sessionSeats[idx];
      const student = students[(i * 12 + idx) % students.length];
      await prisma.studentExam.create({
        data: {
          examSessionId: session.id,
          studentId: student.id,
          stt: idx + 1,
          seatNumber: String(idx + 1),
          seatPosition: seat.id,
        },
      });
      await prisma.examSeat.update({ where: { id: seat.id }, data: { status: 'Assigned' } });
    }

    await prisma.examSession.update({
      where: { id: session.id },
      data: { hasStudentsImported: assignedCount > 0 },
    });

    sessions.push(session.id);
  }

  return sessions;
}

async function main() {
  console.log('🌱 Starting ready-for-seat-feature seed...');

  try {
    console.log('🧹 Resetting existing data...');
    await resetData();

    console.log('👥 Seeding users...');
    const users = await seedUsers();

    console.log('📚 Seeding semester, exam parts, subjects, and subject parts...');
    const semester = await seedSemesterAndSubjects();

    console.log('🏢 Seeding exam rooms...');
    const rooms = await seedRooms();

    console.log('📋 Seeding exam sessions, seats, and student assignments...');
    const sessions = await seedSessionsWithSeats(semester.id, rooms, users);

    console.log('\n============================================');
    console.log('✅ Seed completed (seat-feature ready)');
    console.log('============================================');
    console.log(`Semester: SU26 (${semester.id})`);
    console.log(`Users: ${users.length}`);
    console.log(`Rooms: ${rooms.length}`);
    console.log(`Sessions: ${sessions.length}`);
    console.log('Core subjects for schedule import validation: MAE101, PRF212, IOT101');
    console.log('All created sessions include seats and have hasStudentsImported = true when students were assigned.');
  } catch (error) {
    console.error('❌ Error in ready seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
