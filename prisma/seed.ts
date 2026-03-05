import * as dotenv from 'dotenv';
import * as path from 'path';
import { PrismaClient, Campus } from '@prisma/client';
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

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log('🌱 Starting database seed...');

  try {
    // Clear existing data (in order to respect foreign key constraints)
    console.log('🗑️  Cleaning up existing data...');
    await prisma.studentExam.deleteMany({});
    await prisma.examSession.deleteMany({});
    await prisma.examRoom.deleteMany({});
    await prisma.user.deleteMany({});

    // ============================================
    // 1. CREATE USERS
    // ============================================
    console.log('👥 Creating users...');

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@exam.com',
        fullName: 'Admin User',
        code: 'ADMIN001',
        role: 'ADMIN',
        isActive: true,
      },
    });

    const examOfficer = await prisma.user.create({
      data: {
        email: 'officer@exam.com',
        fullName: 'Exam Officer',
        code: 'EO001',
        role: 'EXAM_OFFICER',
        isActive: true,
      },
    });

    const proctor1 = await prisma.user.create({
      data: {
        email: 'proctor1@exam.com',
        fullName: 'Proctor One',
        code: 'PROC001',
        role: 'PROCTOR',
        isActive: true,
      },
    });

    const proctor2 = await prisma.user.create({
      data: {
        email: 'proctor2@exam.com',
        fullName: 'Proctor Two',
        code: 'PROC002',
        role: 'PROCTOR',
        isActive: true,
      },
    });

    const student1 = await prisma.user.create({
      data: {
        email: 'student1@exam.com',
        fullName: 'Nguyen Van A',
        code: 'SE001',
        role: 'STUDENT',
        isActive: true,
      },
    });

    const student2 = await prisma.user.create({
      data: {
        email: 'student2@exam.com',
        fullName: 'Tran Thi B',
        code: 'SE002',
        role: 'STUDENT',
        isActive: true,
      },
    });

    const student3 = await prisma.user.create({
      data: {
        email: 'student3@exam.com',
        fullName: 'Le Van C',
        code: 'SE003',
        role: 'STUDENT',
        isActive: true,
      },
    });

    const student4 = await prisma.user.create({
      data: {
        email: 'student4@exam.com',
        fullName: 'Pham Duc D',
        code: 'SE004',
        role: 'STUDENT',
        isActive: true,
      },
    });

    const student5 = await prisma.user.create({
      data: {
        email: 'student5@exam.com',
        fullName: 'Hoang Thi E',
        code: 'SE005',
        role: 'STUDENT',
        isActive: true,
      },
    });

    const student6 = await prisma.user.create({
      data: {
        email: 'student6@exam.com',
        fullName: 'Vo Van F',
        code: 'SE006',
        role: 'STUDENT',
        isActive: true,
      },
    });

    const student7 = await prisma.user.create({
      data: {
        email: 'student7@exam.com',
        fullName: 'Do Thi G',
        code: 'SE007',
        role: 'STUDENT',
        isActive: true,
      },
    });

    const student8 = await prisma.user.create({
      data: {
        email: 'student8@exam.com',
        fullName: 'Bui Van H',
        code: 'SE008',
        role: 'STUDENT',
        isActive: true,
      },
    });

    console.log(`✅ Created 12 users`);

    // ============================================
    // 2. CREATE EXAM ROOMS WITH SEAT CONFIGURATION
    // ============================================
    console.log('🏢 Creating exam rooms with seat maps...');

    const campuses: Campus[] = ['HCM', 'HN', 'DN', 'QN', 'CT'];
    const rooms = [];

    for (const campus of campuses) {
      for (let i = 1; i <= 5; i++) {
        const roomNum = `${campus}_${100 + i}`;
        const room = await prisma.examRoom.create({
          data: {
            roomNumber: roomNum,
            capacity: 20 + i,
            status: 'Available',
            max_rows: 5,
            max_columns: 5,
            total_seats: 25,
            campus: campus,
          },
        });
        rooms.push(room);
      }
    }

    const room101 = rooms.find(r => r.roomNumber === 'HCM_101') || rooms[0];
    const room102 = rooms.find(r => r.roomNumber === 'HCM_102') || rooms[1];
    const room201 = rooms.find(r => r.roomNumber === 'HN_101') || rooms[5];
    const room202 = rooms.find(r => r.roomNumber === 'HN_102') || rooms[6];

    console.log(`✅ Created ${rooms.length} exam rooms across ${campuses.length} campuses`);

    // ============================================
    // 3. CREATE EXAM SESSIONS
    // ============================================
    console.log('📋 Creating exam sessions...');

    const now = new Date();
    const session1StartTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const session1EndTime = new Date(session1StartTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

    const session2StartTime = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // Day after tomorrow
    const session2EndTime = new Date(session2StartTime.getTime() + 2 * 60 * 60 * 1000);

    const examSession1 = await prisma.examSession.create({
      data: {
        examRoomId: room101.id,
        proctorId: proctor1.id,
        hallInvigilatorId: examOfficer.id,
        subjectCode: 'CS101',
        examOpenTime: session1StartTime,
        examCloseTime: session1EndTime,
        status: 'Scheduled',
      },
    });

    const examSession2 = await prisma.examSession.create({
      data: {
        examRoomId: room102.id,
        proctorId: proctor2.id,
        hallInvigilatorId: examOfficer.id,
        subjectCode: 'MATH101',
        examOpenTime: session1StartTime,
        examCloseTime: session1EndTime,
        status: 'Scheduled',
      },
    });

    const examSession3 = await prisma.examSession.create({
      data: {
        examRoomId: room201.id,
        proctorId: proctor1.id,
        hallInvigilatorId: examOfficer.id,
        subjectCode: 'ENG101',
        examOpenTime: session2StartTime,
        examCloseTime: session2EndTime,
        status: 'Scheduled',
      },
    });

    console.log(`✅ Created 3 exam sessions`);

    // ============================================
    // 4. CREATE STUDENT EXAMS (WITHOUT SEAT ASSIGNMENTS YET)
    // ============================================
    console.log('📝 Creating student exam registrations (seats will be assigned via API)...');

    // Session 1: CS101 (5 students, no seats assigned yet)
    await prisma.studentExam.create({
      data: {
        examSession: { connect: { id: examSession1.id } },
        student: { connect: { id: student1.id } },
        status: 'REGISTERED',
        isMatched: false,
      },
    });

    await prisma.studentExam.create({
      data: {
        examSession: { connect: { id: examSession1.id } },
        student: { connect: { id: student2.id } },
        status: 'REGISTERED',
        isMatched: false,
      },
    });

    await prisma.studentExam.create({
      data: {
        examSession: { connect: { id: examSession1.id } },
        student: { connect: { id: student3.id } },
        status: 'REGISTERED',
        isMatched: false,
      },
    });

    await prisma.studentExam.create({
      data: {
        examSession: { connect: { id: examSession1.id } },
        student: { connect: { id: student4.id } },
        status: 'REGISTERED',
        isMatched: false,
      },
    });

    await prisma.studentExam.create({
      data: {
        examSession: { connect: { id: examSession1.id } },
        student: { connect: { id: student5.id } },
        status: 'REGISTERED',
        isMatched: false,
      },
    });

    // Session 2: MATH101 (4 students)
    await prisma.studentExam.create({
      data: {
        examSession: { connect: { id: examSession2.id } },
        student: { connect: { id: student2.id } },
        status: 'REGISTERED',
        isMatched: false,
      },
    });

    await prisma.studentExam.create({
      data: {
        examSession: { connect: { id: examSession2.id } },
        student: { connect: { id: student3.id } },
        status: 'REGISTERED',
        isMatched: false,
      },
    });

    await prisma.studentExam.create({
      data: {
        examSession: { connect: { id: examSession2.id } },
        student: { connect: { id: student6.id } },
        status: 'REGISTERED',
        isMatched: false,
      },
    });

    await prisma.studentExam.create({
      data: {
        examSession: { connect: { id: examSession2.id } },
        student: { connect: { id: student7.id } },
        status: 'REGISTERED',
        isMatched: false,
      },
    });

    // Session 3: ENG101 (3 students)
    await prisma.studentExam.create({
      data: {
        examSession: { connect: { id: examSession3.id } },
        student: { connect: { id: student1.id } },
        status: 'REGISTERED',
        isMatched: false,
      },
    });

    await prisma.studentExam.create({
      data: {
        examSession: { connect: { id: examSession3.id } },
        student: { connect: { id: student4.id } },
        status: 'REGISTERED',
        isMatched: false,
      },
    });

    await prisma.studentExam.create({
      data: {
        examSession: { connect: { id: examSession3.id } },
        student: { connect: { id: student8.id } },
        status: 'REGISTERED',
        isMatched: false,
      },
    });

    console.log(`✅ Created 12 student exam registrations`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(50));
    console.log('✅ Database seeding completed successfully!');
    console.log('='.repeat(50));
    console.log('\n📊 Summary:');
    console.log(`   Users: 12 (1 Admin, 1 Officer, 2 Proctors, 8 Students)`);
    console.log(`   Exam Rooms: ${rooms.length} (across ${campuses.length} campuses)`);
    console.log(`   Exam Sessions: 3`);
    console.log(`   Student Exams: 12 (no seats assigned yet)`);

    console.log('\n🔐 Test Credentials:');
    console.log(`   Admin: admin@exam.com / ADMIN001`);
    console.log(`   Officer: officer@exam.com / EO001`);
    console.log(`   Student: student1@exam.com / SE001`);

    console.log('\n💡 Testing the Seat Map Feature:');
    console.log(`   1. Start API: npm run start:dev:api`);
    console.log(`   2. Get auth token (use Google login or test endpoint)`);
    console.log(`   3. Assign seats: POST /student-exams/assign-seats`);
    console.log(`      Body: { "examSessionId": "<sessionId>", "studentIds": ["<id1>", "<id2>", ...] }`);
    console.log(`   4. View seat map: GET /exam-rooms/<roomId>/seat-map`);
    console.log(`   5. Filter by session: GET /exam-rooms/<roomId>/seat-map?examSessionId=<sessionId>`);
    console.log('\n');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
