import * as dotenv from 'dotenv';
import * as path from 'path';
import { PrismaClient, ExamRoomStatus, ExamSeatStatus } from '@prisma/client';
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

// Helper function to generate random dates
function getRandomFutureDate(daysAhead: number): Date {
  const now = new Date();
  return new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
}

function getRandomPastDate(daysAgo: number): Date {
  const now = new Date();
  return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomStatus(): ExamRoomStatus {
  const statuses: ExamRoomStatus[] = [
    ExamRoomStatus.Available,
    ExamRoomStatus.Available,
    ExamRoomStatus.Available,
    ExamRoomStatus.Available,
    ExamRoomStatus.Maintenance,
    ExamRoomStatus.Occupied,
  ];
  return statuses[getRandomInt(0, statuses.length - 1)];
}

async function main() {
  console.log('🌱 Starting comprehensive database seed...');

  try {
    // Clear existing data (in order to respect foreign key constraints)
    console.log('🗑️  Cleaning up existing data...');
    await prisma.activityHistory.deleteMany({});
    await prisma.studentExamPart.deleteMany({});
    await prisma.studentExam.deleteMany({});
    await prisma.examSeat.deleteMany({});
    await prisma.examSession.deleteMany({});
    await prisma.examRoom.deleteMany({});
    await prisma.user.deleteMany({});

    // ============================================
    // 1. CREATE USERS
    // ============================================
    console.log('👥 Creating users...');

    // 1 ADMIN
    const admin = await prisma.user.create({
      data: {
        email: 'admin@exam.com',
        fullName: 'System Administrator',
        code: 'ADMIN001',
        role: 'ADMIN',
        isActive: true,
      },
    });

    // 1 EXAM_OFFICER
    const examOfficer = await prisma.user.create({
      data: {
        email: 'officer@exam.com',
        fullName: 'Chief Exam Officer',
        code: 'EO001',
        role: 'EXAM_OFFICER',
        isActive: true,
      },
    });

    // 5 PROCTORS
    const proctors = [];
    for (let i = 1; i <= 5; i++) {
      const proctor = await prisma.user.create({
        data: {
          email: `proctor${i}@exam.com`,
          fullName: `Proctor ${i}`,
          code: `PROC${String(i).padStart(3, '0')}`,
          role: 'PROCTOR',
          isActive: true,
        },
      });
      proctors.push(proctor);
    }

    // 4 IT_SUPPORT
    const itSupports = [];
    for (let i = 1; i <= 4; i++) {
      const itSupport = await prisma.user.create({
        data: {
          email: `itsupport${i}@exam.com`,
          fullName: `IT Support ${i}`,
          code: `IT${String(i).padStart(3, '0')}`,
          role: 'IT_SUPPORT',
          isActive: true,
        },
      });
      itSupports.push(itSupport);
    }

    // 50 STUDENTS
    const students = [];
    const firstNames = ['Nguyen', 'Tran', 'Le', 'Pham', 'Hoang', 'Vo', 'Do', 'Bui', 'Dang', 'Ngo'];
    const middleNames = ['Van', 'Thi', 'Minh', 'Thanh', 'Duc', 'Hoang', 'Quang', 'Anh', 'Thu', 'Hai'];
    const lastNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

    for (let i = 1; i <= 50; i++) {
      const firstName = firstNames[i % firstNames.length];
      const middleName = middleNames[i % middleNames.length];
      const lastName = lastNames[i % lastNames.length];
      
      const student = await prisma.user.create({
        data: {
          email: `student${i}@exam.com`,
          fullName: `${firstName} ${middleName} ${lastName}${i}`,
          code: `SE${String(i).padStart(4, '0')}`,
          role: 'STUDENT',
          isActive: true,
        },
      });
      students.push(student);
    }

    console.log(`✅ Created ${1 + 1 + 5 + 4 + 50} users (1 Admin, 1 Exam Officer, 5 Proctors, 4 IT Support, 50 Students)`);

    // ============================================
    // 2. CREATE EXAM ROOMS
    // ============================================
    console.log('🏢 Creating exam rooms...');

    const rooms = [];

    // 2 rooms 6x5 (capacity ~30)
    for (let i = 1; i <= 2; i++) {
      const room = await prisma.examRoom.create({
        data: {
          roomNumber: `A${100 + i}`,
          capacity: getRandomInt(28, 30),
          status: getRandomStatus(),
          max_rows: 6,
          max_columns: 5,
          total_seats: getRandomInt(28, 30),
        },
      });
      rooms.push(room);
    }

    // 4 rooms 5x5 (capacity ~25)
    for (let i = 1; i <= 4; i++) {
      const room = await prisma.examRoom.create({
        data: {
          roomNumber: `B${100 + i}`,
          capacity: getRandomInt(23, 25),
          status: getRandomStatus(),
          max_rows: 5,
          max_columns: 5,
          total_seats: getRandomInt(23, 25),
        },
      });
      rooms.push(room);
    }

    // 6 rooms 5x4 (capacity ~20)
    for (let i = 1; i <= 6; i++) {
      const room = await prisma.examRoom.create({
        data: {
          roomNumber: `C${100 + i}`,
          capacity: getRandomInt(18, 20),
          status: getRandomStatus(),
          max_rows: 5,
          max_columns: 4,
          total_seats: getRandomInt(18, 20),
        },
      });
      rooms.push(room);
    }

    console.log(`✅ Created 12 exam rooms (2×6x5, 4×5x5, 6×5x4)`);

    // ============================================
    // 3. CREATE EXAM SESSIONS & AUTO-INITIALIZE SEATS
    // ============================================
    console.log('📋 Creating exam sessions and initializing seats...');

    const subjects = ['CS101', 'CS201', 'CS302', 'MATH101', 'MATH201', 'ENG101', 'PHY101', 'CHEM101', 'BIO101', 'HIS101'];
    const sessions = [];

    // 5 Ongoing sessions
    for (let i = 0; i < 5; i++) {
      const room = rooms[i];
      const startTime = getRandomPastDate(getRandomInt(1, 5));
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

      const session = await prisma.examSession.create({
        data: {
          examRoomId: room.id,
          proctorId: proctors[i % proctors.length].id,
          hallInvigilatorId: proctors[(i + 1) % proctors.length].id,
          subjectCode: subjects[i % subjects.length],
          examOpenTime: startTime,
          examCloseTime: endTime,
          status: 'Ongoing',
          hasStudentsImported: true,
        },
      });
      sessions.push(session);

      // Auto-initialize seats for this session
      const seatData = [];
      for (let row = 1; row <= room.max_rows; row++) {
        for (let col = 1; col <= room.max_columns; col++) {
          seatData.push({
            examSessionId: session.id,
            row: row,
            col: col,
            status: ExamSeatStatus.Available,
          });
        }
      }

      if (seatData.length > 0) {
        await prisma.examSeat.createMany({
          data: seatData,
        });
      }
    }

    // 3 Scheduled sessions
    for (let i = 5; i < 8; i++) {
      const room = rooms[i];
      const startTime = getRandomFutureDate(getRandomInt(1, 10));
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

      const session = await prisma.examSession.create({
        data: {
          examRoomId: room.id,
          proctorId: proctors[i % proctors.length].id,
          hallInvigilatorId: proctors[(i + 1) % proctors.length].id,
          subjectCode: subjects[i % subjects.length],
          examOpenTime: startTime,
          examCloseTime: endTime,
          status: 'Scheduled',
          hasStudentsImported: false,
        },
      });
      sessions.push(session);

      // Auto-initialize seats
      const seatData = [];
      for (let row = 1; row <= room.max_rows; row++) {
        for (let col = 1; col <= room.max_columns; col++) {
          seatData.push({
            examSessionId: session.id,
            row: row,
            col: col,
            status: ExamSeatStatus.Available,
          });
        }
      }

      if (seatData.length > 0) {
        await prisma.examSeat.createMany({
          data: seatData,
        });
      }
    }

    // 2 Ended sessions
    for (let i = 8; i < 10; i++) {
      const room = rooms[i];
      const startTime = getRandomPastDate(getRandomInt(10, 30));
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

      const session = await prisma.examSession.create({
        data: {
          examRoomId: room.id,
          proctorId: proctors[i % proctors.length].id,
          hallInvigilatorId: proctors[(i + 1) % proctors.length].id,
          subjectCode: subjects[i % subjects.length],
          examOpenTime: startTime,
          examCloseTime: endTime,
          status: 'Ended',
          hasStudentsImported: true,
        },
      });
      sessions.push(session);

      // Auto-initialize seats
      const seatData = [];
      for (let row = 1; row <= room.max_rows; row++) {
        for (let col = 1; col <= room.max_columns; col++) {
          seatData.push({
            examSessionId: session.id,
            row: row,
            col: col,
            status: ExamSeatStatus.Available,
          });
        }
      }

      if (seatData.length > 0) {
        await prisma.examSeat.createMany({
          data: seatData,
        });
      }
    }

    console.log(`✅ Created 10 exam sessions (5 Ongoing, 3 Scheduled, 2 Ended) with auto-initialized seats`);

    // ============================================
    // 4. CREATE STUDENT EXAMS (38 STUDENTS)
    // ============================================
    console.log('📝 Creating student exam registrations...');

    let studentExamCount = 0;
    const studentsToAssign = students.slice(0, 38); // First 38 students

    // Distribute students across sessions
    // Sessions 0-4 (Ongoing): 5, 6, 7, 8, 5 students
    // Sessions 5-7 (Scheduled): 3, 2, 2 students
    // Sessions 8-9 (Ended): 0, 0 students (already completed)

    const distribution = [5, 6, 7, 8, 5, 3, 2, 2, 0, 0];

    let studentIndex = 0;
    for (let sessionIdx = 0; sessionIdx < sessions.length; sessionIdx++) {
      const session = sessions[sessionIdx];
      const numStudents = distribution[sessionIdx];

      for (let i = 0; i < numStudents && studentIndex < studentsToAssign.length; i++) {
        const student = studentsToAssign[studentIndex];
        
        // Get an available seat from this session
        const availableSeats = await prisma.examSeat.findMany({
          where: {
            examSessionId: session.id,
            status: ExamSeatStatus.Available,
          },
          take: 1,
        });

        let seatPosition = null;
        if (availableSeats.length > 0) {
          seatPosition = availableSeats[0].id;
          
          // Update seat status to Assigned
          await prisma.examSeat.update({
            where: { id: seatPosition },
            data: { status: ExamSeatStatus.Assigned },
          });
        }

        const status = session.status === 'Ongoing' 
          ? (getRandomInt(1, 10) > 2 ? 'CHECKEDIN' : 'REGISTERED')
          : 'REGISTERED';

        await prisma.studentExam.create({
          data: {
            examSessionId: session.id,
            studentId: student.id,
            stt: i + 1,
            seatNumber: `${i + 1}`,
            seatPosition: seatPosition,
            status: status,
            isMatched: status === 'CHECKEDIN',
            checkinTime: status === 'CHECKEDIN' ? new Date(session.examOpenTime.getTime() - 10 * 60 * 1000) : null,
          },
        });

        studentExamCount++;
        studentIndex++;
      }
    }

    console.log(`✅ Created ${studentExamCount} student exam registrations`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ Database seeding completed successfully!');
    console.log('='.repeat(60));
    console.log('\n📊 Summary:');
    console.log(`   👥 Users: ${1 + 1 + 5 + 4 + 50}`);
    console.log(`      • 1 Admin`);
    console.log(`      • 1 Exam Officer`);
    console.log(`      • 5 Proctors`);
    console.log(`      • 4 IT Support`);
    console.log(`      • 50 Students`);
    console.log(`   🏢 Exam Rooms: 12`);
    console.log(`      • 2 rooms (6x5)`);
    console.log(`      • 4 rooms (5x5)`);
    console.log(`      • 6 rooms (5x4)`);
    console.log(`   📋 Exam Sessions: 10`);
    console.log(`      • 5 Ongoing`);
    console.log(`      • 3 Scheduled`);
    console.log(`      • 2 Ended`);
    console.log(`   🪑 Exam Seats: Auto-initialized for all sessions`);
    console.log(`   📝 Student Exams: ${studentExamCount} (38 students assigned)`);

    console.log('\n🔐 Test Credentials:');
    console.log(`   Admin:        admin@exam.com`);
    console.log(`   Exam Officer: officer@exam.com`);
    console.log(`   Proctor:      proctor1@exam.com - proctor5@exam.com`);
    console.log(`   IT Support:   itsupport1@exam.com - itsupport4@exam.com`);
    console.log(`   Student:      student1@exam.com - student50@exam.com`);

    console.log('\n💡 API Testing:');
    console.log(`   1. Start API: npm run start:dev:api`);
    console.log(`   2. Get auth token: POST /api/auth/test-token`);
    console.log(`   3. List sessions: GET /api/exam-sessions`);
    console.log(`   4. View seats: GET /api/exam-seats/session/{sessionId}`);
    console.log(`   5. Lock/unlock seats: PATCH /api/exam-seats/{id}/status`);
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
