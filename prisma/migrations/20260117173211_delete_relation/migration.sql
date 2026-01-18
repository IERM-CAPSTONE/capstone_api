-- DropForeignKey
ALTER TABLE "ActivityHistory" DROP CONSTRAINT "ActivityHistory_studentExamId_fkey";

-- DropForeignKey
ALTER TABLE "ActivityHistory" DROP CONSTRAINT "ActivityHistory_ticketId_fkey";

-- DropForeignKey
ALTER TABLE "Device" DROP CONSTRAINT "Device_registeredBy_fkey";

-- DropForeignKey
ALTER TABLE "ExamSession" DROP CONSTRAINT "ExamSession_examRoomId_fkey";

-- DropForeignKey
ALTER TABLE "ExamSession" DROP CONSTRAINT "ExamSession_hallInvigilatorId_fkey";

-- DropForeignKey
ALTER TABLE "ExamSession" DROP CONSTRAINT "ExamSession_proctorId_fkey";

-- DropForeignKey
ALTER TABLE "FaceEnrollment" DROP CONSTRAINT "FaceEnrollment_deviceId_fkey";

-- DropForeignKey
ALTER TABLE "FaceEnrollment" DROP CONSTRAINT "FaceEnrollment_identityId_fkey";

-- DropForeignKey
ALTER TABLE "Identity" DROP CONSTRAINT "Identity_userId_fkey";

-- DropForeignKey
ALTER TABLE "IssueTicket" DROP CONSTRAINT "IssueTicket_assigneeId_fkey";

-- DropForeignKey
ALTER TABLE "IssueTicket" DROP CONSTRAINT "IssueTicket_reporterId_fkey";

-- DropForeignKey
ALTER TABLE "IssueTicket" DROP CONSTRAINT "IssueTicket_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_fromId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_toId_fkey";

-- DropForeignKey
ALTER TABLE "ProctorApplication" DROP CONSTRAINT "ProctorApplication_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "ProctorAssignment" DROP CONSTRAINT "ProctorAssignment_assignedById_fkey";

-- DropForeignKey
ALTER TABLE "ProctorAssignment" DROP CONSTRAINT "ProctorAssignment_examSessionId_fkey";

-- DropForeignKey
ALTER TABLE "ProctorAssignment" DROP CONSTRAINT "ProctorAssignment_proctorId_fkey";

-- DropForeignKey
ALTER TABLE "StudentExam" DROP CONSTRAINT "StudentExam_examSessionId_fkey";

-- DropForeignKey
ALTER TABLE "StudentExam" DROP CONSTRAINT "StudentExam_studentId_fkey";

-- DropForeignKey
ALTER TABLE "StudentExamPart" DROP CONSTRAINT "StudentExamPart_studentExamId_fkey";
